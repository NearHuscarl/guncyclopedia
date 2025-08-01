import type { AnyRouter, RegisteredRouter } from "@tanstack/react-router";
import { useSearch } from "@tanstack/react-router";

export type TAppState = ReturnType<typeof useSearch<RegisteredRouter, "/">>;
export type TSelectCallback<T> = Parameters<typeof useSearch<RegisteredRouter, "/", true, true, T>>[0]["select"];

export function useAppState<T>(select?: TSelectCallback<T>): T {
  return useSearch<AnyRouter, "/", true, true, T>({ from: "/", select });
}
