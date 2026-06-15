import type { Ref, ComputedRef, WatchSource, WatchCallback } from './types';

export let activeEffect: null | ReactiveEffect = null;
export type keyToDepMap = Map<any, Dep>;
export const targetMap: WeakMap<object, keyToDepMap> = new WeakMap();
export const proxyMap: WeakMap<object, any> = new WeakMap();

export function isFunction (value: any): value is Function {
  return typeof value === 'function';
}

export function isObject (value: any): value is Record<any, any> {
  return value !== null && typeof value === 'object';
}

function isRef<T> (value: any): value is RefImpl<T> {
  return !!(value && value.__v_isRef === true);
}

export function isReactive (value: unknown): boolean {
  return !!(value && (value as any)[ReactiveFlags.IS_REACTIVE] === true);
}

export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive'
}

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
  public readonly __v_isRef = true;

  dep = new Dep();
  private _value;
  public readonly isShallow: boolean;

  constructor (value: T, isShallow: boolean) {
    this._value = isShallow ? value : toReactive(value);
    this.isShallow = isShallow;
  }

  get value (): T {
    this.dep.track();
    return this._value;
  }

  set value (newValue) {
    this._value = this.isShallow ? newValue : toReactive(newValue);
    this.dep.trigger();
  }
}

export const toReactive =  <T>(value: T): T => 
  isObject(value) ? reactive(value) : value;

export function reactive<T extends object> (obj: T): T {
  const existingProxy = proxyMap.get(obj);
  if (existingProxy) {
    return existingProxy;
  }

  const proxy = new Proxy(obj, {
    get: (target, key): any => {
      if (key == ReactiveFlags.IS_REACTIVE) {
        return true;
      }

      track(target, key as string);
      const result = Reflect.get(target, key);
      if (typeof result === 'function') {
        return result.bind(target);
      }

      return typeof result === 'object' && result !== null ? reactive(result) : result;
    },
    set: (target, key, value): boolean => {
      const result = Reflect.set(target, key, value);
      trigger(target, key as string);
      return result;
    },
  });

  proxyMap.set(obj, proxy);

  return proxy;
}

export function ref<T> (value: any): RefImpl<T> {
  return createRef(value, false);
}

export function shallowRef<T> (value: any): RefImpl<T> {
  return createRef(value, true);
}

export function createRef<T> (value: any, shallow: boolean): RefImpl<T> {
  if (isRef(value)) {
    return value as RefImpl<T>;
  }

  return new RefImpl(value, shallow);
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


export function watch<T> (source: WatchSource<T> | WatchSource<T>[], callback?: WatchCallback): void {
  let getter: () => any;
  let effect: ReactiveEffect;
  let oldValue: any;
  let newValue: any;
  let deep: boolean = false;

  const reactiveGetter = (source: object): any => {
    return traverse(source);
  };

  if (isRef(source)) {
    getter = (): any => source.value;
    if (isReactive(source.value)) {
      deep = true;
    };
  } else if (isReactive(source)) {
    getter = (): any => reactiveGetter(source);
  } else if (Array.isArray(source)) {
    getter = (): any => source.map(s => {
      if (isRef(s)) {
        return s.value;
      } else if (isReactive(s)) {
        return reactiveGetter(s);
      } else {
        throw TypeError(`One of source uses non-supported type ${typeof source}`);
      }
    });
  } else {
    throw TypeError(`Source use non-supported type ${typeof source}`);
  }

  if (callback && deep) {
    const baseGetter = getter;
    const depth = deep === true ? Infinity : 0;
    getter = (): any => traverse(baseGetter(), depth);
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

export function traverse (value: unknown, depth: number = Infinity, seen?: Map<unknown, number>): unknown {
  if (!isObject(value) || depth <= 0) {
    return value;
  }

  seen = seen || new Map();
  if ((seen.get(value) || 0) >= depth) {
    return value;
  }
  seen.set(value, depth);
  depth--;
  if (isRef(value)) {
    traverse(value.value, depth, seen);
  } else if (Array.isArray(value)) {
    for (const obj of value) {
      traverse(obj, depth, seen);
    }
  } else if (typeof value === 'object') {
    for (const key in value as any) {
      traverse((value as any)[key], depth, seen);
    }
  }

  return value;
}

export function watchEffect (source: () => any): void {
  const effect = new ReactiveEffect(source);

  effect.trigger();
}