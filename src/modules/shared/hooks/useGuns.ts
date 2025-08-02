import { useGunStore } from "../store/gun.store";
import { useAppState } from "./useAppState";
import { useLoaderData } from "./useLoaderData";

export function useGuns() {
  return useLoaderData((data) => data.guns);
}

export function useSelectedGun() {
  const selectedId = useAppState((state) => state.selectedId);
  return useGunStore((state) => state.gunLookup[selectedId ?? -1]);
}
