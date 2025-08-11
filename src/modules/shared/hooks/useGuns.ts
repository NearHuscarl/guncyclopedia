import { useMemo } from "react";
import { useGunStore } from "../store/gun.store";
import { useAppState } from "./useAppState";
import { useLoaderData } from "./useLoaderData";
import type { TSearchParams } from "../route/schema";

export function useGuns() {
  return useLoaderData((data) => data.guns);
}

export function useSelectedGun() {
  const selectedId = useAppState((state) => state.selectedId);
  return useGunStore((state) => state.gunLookup[selectedId ?? -1]);
}

export function useHoverGun() {
  const hoverGunId = useGunStore((state) => state.hoverGunId);
  const isComparisonMode = useGunStore((state) => state.isComparisonMode);
  const gun = useGunStore((state) => state.gunLookup[hoverGunId ?? -1]);

  if (!isComparisonMode) {
    return;
  }
  return gun;
}

export function useFilteredGuns(filter: TSearchParams["filter"]) {
  const guns = useGuns();
  const { primaryColor, secondaryColor, feature } = filter ?? {};

  return useMemo(() => {
    const res = guns.filter((g) => {
      let match = true;
      if (primaryColor && g.animation.frames[0].colors[0] !== primaryColor) {
        match = false;
      }
      if (secondaryColor && g.animation.frames[0].colors[1] !== secondaryColor) {
        match = false;
      }
      if (feature && !g.featureFlags.includes(feature)) {
        match = false;
      }
      return match;
    });

    return res;
  }, [guns, primaryColor, secondaryColor, feature]);
}
