import { describe, expect, it } from 'vitest';
import { ref, computed } from '../src';

describe('[basic functionality] computed()', () => {
  describe('with primitive ref', () => {
    it('should derive value from a primitive ref', () => {
      const count = ref(2);
      const doubled = computed(() => count.value * 2);
      expect(doubled.value).toEqual(4);
    });

    it('should update when the underlying ref changes', () => {
      const count = ref(2);
      const doubled = computed(() => count.value * 2);
      count.value = 5;
      expect(doubled.value).toEqual(10);
    });

    it('should work with string refs', () => {
      const name = ref('hello');
      const upper = computed(() => name.value.toUpperCase());
      expect(upper.value).toEqual('HELLO');
      name.value = 'world';
      expect(upper.value).toEqual('WORLD');
    });

    it('should work with boolean refs', () => {
      const flag = ref(true);
      const negated = computed(() => !flag.value);
      expect(negated.value).toEqual(false);
      flag.value = false;
      expect(negated.value).toEqual(true);
    });
  });

  describe('with object ref', () => {
    it('should derive value from an object ref', () => {
      const obj = ref({ a: 1, b: 2 });
      const sum = computed(() => obj.value.a + obj.value.b);
      expect(sum.value).toEqual(3);
    });

    it('should update when the object ref is replaced', () => {
      const obj = ref({ a: 1, b: 2 });
      const sum = computed(() => obj.value.a + obj.value.b);
      obj.value = { a: 10, b: 20 };
      expect(sum.value).toEqual(30);
    });

    it('should derive a property from an object ref', () => {
      const user = ref({ name: 'Alice', age: 30 });
      const greeting = computed(() => `Hi, ${user.value.name}`);
      expect(greeting.value).toEqual('Hi, Alice');
      user.value = { name: 'Bob', age: 25 };
      expect(greeting.value).toEqual('Hi, Bob');
    });

    it('should reflect in-place property change', () => {
      const obj = ref({ a: 1, b: 2 });
      const sum = computed(() => obj.value.a + obj.value.b);
      obj.value.a = 10;
      expect(sum.value).toEqual(12);
    });

    it('should reflect property deletion', () => {
      const obj = ref<Record<string, number>>({ a: 1, b: 2 });
      const keys = computed(() => Object.keys(obj.value));
      delete obj.value.b;
      expect(keys.value).toEqual(['a']);
    });
  });

  describe('with array ref', () => {
    it('should derive value from an array ref', () => {
      const arr = ref([1, 2, 3]);
      const len = computed(() => arr.value.length);
      expect(len.value).toEqual(3);
    });

    it('should update when the array ref is replaced', () => {
      const arr = ref([1, 2, 3]);
      const sum = computed(() => arr.value.reduce((a, b) => a + b, 0));
      expect(sum.value).toEqual(6);
      arr.value = [10, 20];
      expect(sum.value).toEqual(30);
    });

    it('should derive first element from an array ref', () => {
      const arr = ref(['a', 'b', 'c']);
      const first = computed(() => arr.value[0]);
      expect(first.value).toEqual('a');
      arr.value = ['x', 'y'];
      expect(first.value).toEqual('x');
    });

    it('should reflect in-place item change via index', () => {
      const arr = ref([1, 2, 3]);
      const first = computed(() => arr.value[0]);
      arr.value[0] = 99;
      expect(first.value).toEqual(99);
    });

    it('should reflect in-place push', () => {
      const arr = ref([1, 2]);
      const len = computed(() => arr.value.length);
      arr.value.push(3);
      expect(len.value).toEqual(3);
    });

    it('should reflect in-place splice (delete)', () => {
      const arr = ref([1, 2, 3]);
      const sum = computed(() => arr.value.reduce((a, b) => a + b, 0));
      arr.value.splice(1, 1);
      expect(sum.value).toEqual(4);
    });
  });

  describe('with Map ref', () => {
    it('should derive value from a Map ref', () => {
      const map = ref(new Map([['key', 42]]));
      const val = computed(() => map.value.get('key'));
      expect(val.value).toEqual(42);
    });

    it('should update when the Map ref is replaced', () => {
      const map = ref(new Map([['key', 1]]));
      const val = computed(() => map.value.get('key'));
      map.value = new Map([['key', 99]]);
      expect(val.value).toEqual(99);
    });

    it('should derive size from a Map ref', () => {
      const map = ref(new Map<string, number>());
      const size = computed(() => map.value.size);
      expect(size.value).toEqual(0);
      map.value = new Map([['a', 1], ['b', 2]]);
      expect(size.value).toEqual(2);
    });

    it('should reflect in-place set on a Map', () => {
      const map = ref(new Map([['key', 1]]));
      const val = computed(() => map.value.get('key'));
      map.value.set('key', 42);
      expect(val.value).toEqual(42);
    });

    it('should reflect in-place delete on a Map', () => {
      const map = ref(new Map([['a', 1], ['b', 2]]));
      const size = computed(() => map.value.size);
      map.value.delete('a');
      expect(size.value).toEqual(1);
    });
  });

  describe('with Set ref', () => {
    it('should derive value from a Set ref', () => {
      const set = ref(new Set([1, 2, 3]));
      const size = computed(() => set.value.size);
      expect(size.value).toEqual(3);
    });

    it('should update when the Set ref is replaced', () => {
      const set = ref(new Set([1, 2, 3]));
      const has2 = computed(() => set.value.has(2));
      expect(has2.value).toEqual(true);
      set.value = new Set([4, 5]);
      expect(has2.value).toEqual(false);
    });

    it('should derive array from a Set ref', () => {
      const set = ref(new Set(['a', 'b']));
      const arr = computed(() => [...set.value]);
      expect(arr.value).toEqual(['a', 'b']);
      set.value = new Set(['x']);
      expect(arr.value).toEqual(['x']);
    });

    it('should reflect in-place add on a Set', () => {
      const set = ref(new Set([1, 2]));
      const size = computed(() => set.value.size);
      set.value.add(3);
      expect(size.value).toEqual(3);
    });

    it('should reflect in-place delete on a Set', () => {
      const set = ref(new Set([1, 2, 3]));
      const has2 = computed(() => set.value.has(2));
      set.value.delete(2);
      expect(has2.value).toEqual(false);
    });
  });

  describe('with nested ref', () => {
    it('should derive value from a nested ref', () => {
      const inner = ref(5);
      const outer = ref(inner);
      const doubled = computed(() => outer.value * 2);
      expect(doubled.value).toEqual(10);
    });

    it('should update when the inner ref changes', () => {
      const inner = ref(5);
      const outer = ref(inner);
      const doubled = computed(() => outer.value * 2);
      inner.value = 10;
      expect(doubled.value).toEqual(20);
    });

    it('should update when the outer ref is reassigned', () => {
      const inner = ref(5);
      const outer = ref(inner);
      const doubled = computed(() => outer.value * 2);
      outer.value = 100;
      expect(doubled.value).toEqual(200);
    });
  });

  describe('read-only behavior', () => {
    it('should throw when setting value on a computed', () => {
      const count = ref(1);
      const doubled = computed(() => count.value * 2);
      expect(() => {
        (doubled as any).value = 10;
      }).toThrow();
    });
  });

  describe('with multiple refs', () => {
    it('should derive from multiple refs', () => {
      const a = ref(1);
      const b = ref(2);
      const sum = computed(() => a.value + b.value);
      expect(sum.value).toEqual(3);
      a.value = 10;
      expect(sum.value).toEqual(12);
      b.value = 20;
      expect(sum.value).toEqual(30);
    });
  });
});
