import { describe, expect, it } from 'vitest';
import { ref } from '../src';
import { randomInt } from 'node:crypto';

describe('[basic functionality] ref())', () => {
  it('should not crash when used to define a variable', () => {
    expect(() => {
      const num = ref(5);
      const str = ref('hung an cut');
      const bool = ref(false);
      const _undefined = ref(undefined);
      const _null = ref(null);
      const arr = ref([null, undefined, 5]);
      const func = ref(function foo () { console.log('test'); });
      const arrowFunc = ref(() => { console.log('test'); });
      const obj = ref({
        num: 5,
        str: 'hung hung',
        bool: false,
      });
      const map = ref(new Map<string, string>());
      const set = ref(new Set<string>());
    }).not.toThrow();
  });
  
  it('should not crash when used to define complex refs', () => {
    expect(() => {
      const objRef = {
        numRef: ref(1),
        strRef: ref('hung hung'),
        boolRef: ref('hi'),
      }; 
      const objRefOfRefs = ref({
        numRef: ref(1),
        strRef: ref('hung hung'),
        boolRef: ref('hi'),
      }); // TODO: Check vue to see what's the behavior of this

      const nestedRef = ref(ref(ref('would it crash'))); // This one should auto unwrap to a single ref

      const arrRefOfRefs = ref([
        ref(1), ref('hunghung'),
      ]); // TODO: Check vue to see what's the behavior of this
      const arrRef = [ref(1), ref('hung hung')];

      const mapRef = new Map([
        [ref(1), ref(2)],
      ]);

      const setRef = new Set([
        ref(1),
        ref(1),
        ref(1),
      ]);
    }).not.toThrow();
  });

  it('should not crash when used to define inside an if statement', () => {
    expect(() => {
      if (randomInt(6) <= 3) {
        const _ = ref(5);
      }
    }).not.toThrow();
  });

  it('should not crash when used to define inside a looping statement', () => {
    expect(() => {
      for (let i = 0; i < 100; ++i) {
        const _ = ref(i);
      }
    }).not.toThrow();
  });

  it('should return the same value it is passed in', () => {
    const a = ref(1);
    expect(a.value).toEqual(1);
  });

  it('should return the same value it is assigned to', () => {
    const a = ref(1);
    a.value = 86;
    expect(a.value).toEqual(86);
  });

  it('should return the same value it is assigned to in a function', () => {
    const a = ref(1);

    function f () {
      a.value = 86;
    }
    f();

    expect(a.value).toEqual(86);
  });

  it('should unwrap nested refs', () => {
    const nestedRef = ref(ref(ref(10)));
    expect(nestedRef.value).toEqual(10);
  });

  it('should allow a function to return itself', () => {
    function f (i: number) {
      const a = ref(1);
      a.value = i;
      return a;
    }
    expect(f(86).value).toEqual(86);
    expect(f(69).value).toEqual(69);
    expect(f(156).value).toEqual(156);
  });

  it('should return a different ref each time', () => {
    expect(ref(1)).not.toBe(ref(1));
    expect(ref(undefined)).not.toBe(ref(undefined));
    expect(ref(null)).not.toBe(ref(null));
  });
});
