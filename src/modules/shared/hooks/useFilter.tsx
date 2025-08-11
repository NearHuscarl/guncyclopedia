import { useAppState, type TAppState } from "./useAppState";

type TSelectFilterCallback<R> = (filter: TFilter) => R;
type TFilter = NonNullable<TAppState["filter"]>;

export function useFilter(): TAppState["filter"];
export function useFilter<R = TFilter>(select: TSelectFilterCallback<R>): R;

export function useFilter<R = TFilter>(select?: (filter: TFilter) => R): R {
  return useAppState((state) => {
    const filter = (state.filter ?? {}) as TFilter;
    return select ? select(filter) : (filter as R);
  });
}
