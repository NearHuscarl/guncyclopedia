import { useEffect, useRef } from "react";

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

export function useUnmountRef() {
  const ref = useRef(false);

  useEffect(() => {
    ref.current = false; // strict mode will re-run this effect

    return () => {
      ref.current = true;
    };
  }, []);

  return ref;
}
