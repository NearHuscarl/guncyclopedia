import { useLoaderData as _useLoaderData, type AnyRouter, type RegisteredRouter } from "@tanstack/react-router";

export type TLoaderData = ReturnType<typeof _useLoaderData<RegisteredRouter, "/">>;
export type TSelectCallback<T> = Parameters<typeof _useLoaderData<RegisteredRouter, "/", true, T>>[0]["select"];

export function useLoaderData<T>(select?: TSelectCallback<T>): T {
  return _useLoaderData<AnyRouter, "/", true, T>({ from: "/", select });
}
