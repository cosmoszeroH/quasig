import { describe, expect, it } from 'vitest';
import { computed, ref } from '../src';

describe('ref basic funtionality', () => {
  const a = ref(5);
  const b = ref(10);
  const sum = computed(() => a.value + b.value);

  it('print the previous sum', () => {
    expect(sum.value).toEqual(15);
  });
  
  it('print the later sum', () => {
    a.value = 6;
    expect(sum.value).toEqual(16);
  });
});