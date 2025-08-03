/**
 * Extracts keys from the given type `T` where the corresponding value is `number` or `number | undefined`.
 *
 * This is useful when you want to operate only on numeric fields of a type,
 * such as for performing aggregations, calculations, or validations.
 *
 * Boolean, string, object, and other types are excluded.
 *
 * @example
 * type Example = {
 *   id: string;
 *   damage: number;
 *   range?: number;
 *   isHoming: boolean;
 * };
 *
 * type Numeric = NumericKeys<Example>;
 * //   ^? "damage" | "range"
 */
export type NumericKeys<T> = Exclude<
  {
    [K in keyof T]: T[K] extends number | undefined ? K : never;
  }[keyof T],
  undefined
>;

export type BooleanKeys<T> = Exclude<
  {
    [K in keyof T]: T[K] extends boolean | undefined ? K : never;
  }[keyof T],
  undefined
>;

export type ArrayKeys<T, E = object> = Exclude<
  {
    [K in keyof T]: T[K] extends Array<E> | undefined ? K : never;
  }[keyof T],
  undefined
>;
