import { useSearch } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

export function useIsDebug() {
  const search = useSearchParams();
  return search.debug;
}

export function useSearchParams() {
  return useSearch({ from: "/" });
}

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
