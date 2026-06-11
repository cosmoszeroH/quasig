export interface Ref<T> {
  value: T;
};

export interface ComputedRef<T> {
  readonly value: T;
};

export type WatchSource<T> = Ref<T> | ComputedRef<T>;

export type WatchCallback<NV = any, OV = any> = (
  newValue: NV,
  oldValue: OV,
) => any;