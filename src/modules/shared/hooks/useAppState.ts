import { useSearch } from "@tanstack/react-router";
import type { AnyRouter } from "@tanstack/react-router";
import type { TSearchParams } from "../route/schema";

export type TAppState = TSearchParams;
export type TSelectAppCallback<T> = (state: TAppState) => T;

export function useAppState(): TAppState;
export function useAppState<T>(select: TSelectAppCallback<T>): T;

export function useAppState<T>(select?: TSelectAppCallback<T>): T {
  return useSearch<AnyRouter, "/", true, true, T>({ from: "/", select });
}
