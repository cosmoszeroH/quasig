import type { Ref, ComputedRef, WatchSource, WatchCallback } from './types';

export let activeEffect: null | ReactiveEffect = null;
export type keyToDepMap = Map<any, Dep>;
export const targetMap: WeakMap<object, keyToDepMap> = new WeakMap();

export class ReactiveEffect {
  fn: () => any;
  scheduler?: ((...args: any[]) => any) | undefined;

  constructor (fn: () => any, scheduler?: ((...args: any[]) => any) | undefined) {
    this.fn = fn;

    if (scheduler) {
      this.scheduler = scheduler;
    }
  }

  run = (): any => {
    const prevEffect = activeEffect;

    try {
      activeEffect = this;

      return this.fn();
    } finally {
      activeEffect = prevEffect;
    }
  };

  trigger (): void {
    if (this.scheduler) {
      this.scheduler();
    } else {
      this.run();
    }
  }
}

export class Dep {
  deps: Set<ReactiveEffect> | undefined = undefined;

  constructor () { }

  track (): any {
    if (!this.deps) {
      this.deps = new Set();
    }
    if (activeEffect) {
      this.deps.add(activeEffect);
    }
  }

  trigger (): any {
    if (!this.deps) {
      return;
    }
    for (const effect of this.deps) {
      effect.trigger();
    }
  }
}


export function track (target: object, key: string): void {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }

  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Dep()));
  }

  dep.track();
}

export function trigger (target: object, key: string): void {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }

  const dep = depsMap.get(key);
  if (!dep || !dep.deps) {
    return;
  }

  for (const effect of dep.deps) {
    effect.trigger();
  }
}

export class RefImpl<T> implements Ref<T> {
  dep = new Dep();
  private _value;

  constructor (value: T) {
    this._value = value;
  }

  get value (): T {
    this.dep.track();
    return this._value;
  }

  set value (newValue) {
    this._value = newValue;
    this.dep.trigger();
  }
}

export function ref<T> (value: any): RefImpl<T> {
  if (isRef(value)) {
    return value as RefImpl<T>;
  }

  return new RefImpl(value);
}

function isRef<T> (obj: any): obj is RefImpl<T> {
  return (obj instanceof RefImpl);
}

export class ComputedRefImpl<T> implements ComputedRef<T> {
  public readonly __v_isRef = true;

  dep = new Dep();
  effect: ReactiveEffect;

  constructor (effect: ReactiveEffect) {
    this.effect = effect;
  }

  get value (): T {
    this.dep.track();
    return this.effect.run();
  }

  set value (_newValue) {
    throw Error('Computed is read-only.');
  }
}

export function computed<T> (fn: () => any): ComputedRefImpl<T> {
  const effect = new ReactiveEffect(fn);
  return new ComputedRefImpl(effect);
}

export function isFunction (value: any): value is Function {
  return typeof value === 'function';
}

export function watch<T> (source: WatchSource<T> | WatchSource<T>[], callback?: WatchCallback): void {
  let getter: () => any;
  let effect: ReactiveEffect;
  let oldValue: any;
  let newValue: any;

  if (isRef(source)) {
    getter = (): any => source.value;
  } else if (Array.isArray(source)) {
    getter = (): any => source.map(s => s.value);
  } else {
    throw TypeError(`Source not support type ${typeof source}`);
  }

  if (callback) {
    const scheduler = (): void => {
      newValue = effect.run();
      callback(newValue, oldValue);
      oldValue = newValue;
    };

    effect = new ReactiveEffect(getter, scheduler);
  } else {
    effect = new ReactiveEffect(getter);
  }

  if (callback) {
    oldValue = effect.run();
  } else {
    effect.run();
  }
}

export function watchEffect (source: () => any): void {
  const effect = new ReactiveEffect(source);

  effect.trigger();
}