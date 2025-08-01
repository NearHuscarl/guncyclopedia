import { useAppState } from "./useAppState";

export function useIsDebug() {
  return useAppState((state) => state.debug);
}
