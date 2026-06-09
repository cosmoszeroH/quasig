import type { Ref, ComputedRef } from './types';

export let activeEffect: null | ReactiveEffect = null;
export type keyToDepMap = Map<any, Dep>;
export const targetMap: WeakMap<object, keyToDepMap> = new WeakMap();

export class ReactiveEffect {
  fn: () => any;

  constructor (fn: () => any) {
    this.fn = fn;
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
}

export class Dep {
  deps: Set<ReactiveEffect>|undefined = undefined;

  constructor () {}

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
      effect.run();
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
    effect.run();
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

export function ref<T> (value: any): Ref<T> {
  if (isRef(value)) {
    return value;
  }

  return new RefImpl(value);
}

function isRef (obj: any): boolean {
  return (obj instanceof RefImpl);
}

export class ComputedRefImpl<T> implements ComputedRef<T> {
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