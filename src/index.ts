import type { Ref } from './types';

const dependencyMap = new WeakMap<Ref<unknown>, Set<() => void>>();

function track<T> (thisArg: Ref<T>, effect: () => void) {
  const effects = dependencyMap.get(thisArg);

  if (!effects) {
    dependencyMap.set(thisArg, new Set());
  }

  dependencyMap.get(thisArg)?.add(effect);
}

function trigger<T> (thisArg: Ref<T>) {
  const effects = dependencyMap.get(thisArg);

  if (!effects) return;

  for (const effect of effects) {
    effect();
  }
}

export function ref<T> (value: T): Ref<T> {
  const result = {
    _value: value,

    get value (): T {
      return this._value;
    },

    set value (newVal: T) {
      this._value = newVal;
      trigger(this);
    },
  };
  
  return result;
}


export function watch (refs: Ref<unknown>[], effect: () => void) {
  for (const ref of refs) {
    track(ref, effect);
  }
}