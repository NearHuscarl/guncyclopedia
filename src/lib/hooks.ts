import { useEffect, useRef, useState } from "react";

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

export function useToggleIndex(initial = -1) {
  const [selectedIndex, setSelectedIndex] = useState(initial);

  return [
    selectedIndex,
    (index: number) => {
      setSelectedIndex((prev) => (prev === index ? -1 : index));
    },
  ] as const;
}
