export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

type Builtin = Date | Uint8Array | RegExp;

export type ExpandRecursively<T> =
  T extends Builtin ? T
  : T extends Array<infer U> ? ExpandRecursively<U>[]
  : T extends object ? { [K in keyof T]: ExpandRecursively<T[K]> }
  : T;

export type UnwrapTuple<T extends unknown[]> =
  T extends [infer U] ? U : T[number];

export interface Controller {
  priority: number;
  init(): Promise<void> | void;
}
