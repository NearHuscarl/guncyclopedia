import { useLoaderData } from "./useLoaderData";

export function useGuns() {
  return useLoaderData((data) => data.guns);
}
