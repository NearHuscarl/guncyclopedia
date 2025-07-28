import { useSearch } from "@tanstack/react-router";

export function useIsDebug() {
  const search = useSearchParams();
  return search.debug;
}

export function useSearchParams() {
  return useSearch({ from: "/" });
}
