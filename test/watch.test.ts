import { describe, expect, it, vi } from 'vitest';
import { ref, watch, watchEffect } from '../src';

describe('watch function implementation', () => {

  it('should not throw or crash when creating baseline watches', () => {
    expect(() => {
      const num = ref(10);
      watch(num, () => { });
      watch([num], () => { });
    }).not.toThrow();
  });

  it('should be lazy by default and not trigger callback on initialization', () => {
    const count = ref(0);
    const cb = vi.fn();

    watch(count, cb);

    expect(cb).not.toHaveBeenCalled();
  });

  it('should trigger the callback with arguments (newValue, oldValue) when a single ref mutates', () => {
    const message = ref('hello');
    let capturedNew: any;
    let capturedOld: any;

    watch(message, (newVal, oldVal) => {
      capturedNew = newVal;
      capturedOld = oldVal;
    });

    message.value = 'world';

    expect(capturedNew).toEqual('world');
    expect(capturedOld).toEqual('hello');
  });

  it('should support array source inputs mapping values concurrently', () => {
    const r1 = ref(1);
    const r2 = ref(2);
    let capturedNew: any;
    let capturedOld: any;

    watch([r1, r2], (newVals, oldVals) => {
      capturedNew = newVals;
      capturedOld = oldVals;
    });

    r1.value = 10;

    expect(capturedNew).toEqual([10, 2]);
    expect(capturedOld).toEqual([1, 2]);
  });

  it('should trigger execution sequence when values within an array change sequentially', () => {
    const r1 = ref('A');
    const r2 = ref('B');
    const cb = vi.fn();

    watch([r1, r2], cb);

    r1.value = 'X';
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(['X', 'B'], ['A', 'B']);

    r2.value = 'Y';
    expect(cb).toHaveBeenCalledTimes(2);
    expect(cb).toHaveBeenCalledWith(['X', 'Y'], ['X', 'B']);
  });

  it('should safely crash with a TypeError if an unsupported source type is supplied', () => {
    expect(() => {
      // Testing your fallback block throwing an explicit error message structure
      watch('not a ref string' as any, () => { });
    }).toThrow(/Source not support type string/);
  });

  it('should handle nested references unwrapping properties inside the array mapper runtime loop', () => {
    const innerRef = ref(50);
    const nestedRef = ref(innerRef);
    const cb = vi.fn();

    watch(nestedRef, cb);

    innerRef.value = 100;
    expect(cb).toHaveBeenCalledWith(100, 50);
  });

  it('should execute raw tracking without throwing if callback is omitted/undefined', () => {
    // Your implementation provides: if (callback) { ... } else { effect.run() }
    // Checking that this path executes correctly without throwing an error
    expect(() => {
      const balance = ref(1000);
      watch(balance);
      balance.value = 2000;
    }).not.toThrow();
  });
});

describe('[basic functionality] watchEffect()', () => {
  it('should run immediately on initialization', () => {
    const count = ref(10);
    const cb = vi.fn(() => {
      // Access value to track it
      const _ = count.value;
    });

    watchEffect(cb);

    // Should fire instantly on creation frame to catch dependencies
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('should auto-track any ref accessed within the function body', () => {
    const message = ref('hello');
    let captured = '';

    watchEffect(() => {
      captured = message.value;
    });

    expect(captured).toEqual('hello');

    // Mutate the dependency
    message.value = 'world';

    // The scheduler re-ran the effect function automatically
    expect(captured).toEqual('world');
  });

  it('should track the dependency by logic not all variable in the callback', () => {
    const cond = ref('false');
    const a = ref(10);
    const b = ref(20);

    watchEffect(() => {
      if (cond.value) {
        a.value = 20;
      } else {
        b.value = 25;
      }
    });

    expect(a.dep.deps).toBeNullable();
    expect(b.dep.deps).toBeNullable();
    expect(cond.dep.deps).not.toBeNullable();
  });
});