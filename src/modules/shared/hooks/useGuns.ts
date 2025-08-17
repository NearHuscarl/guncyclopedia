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
  const isComparisonMode = useAppState((state) => state.isComparisonMode);
  const gun = useGunStore((state) => state.gunLookup[hoverGunId ?? -1]);

  if (!isComparisonMode) {
    return;
  }
  return gun;
}

export function useFilteredGuns(filter: TSearchParams["filter"]) {
  const guns = useGuns();
  const gunStatsLookup = useGunStore((state) => state.gunStatsLookup);
  const { primaryColor, secondaryColor, feature, quality, shootStyle, gunClass, range } = filter ?? {};

  return useMemo(() => {
    const res = guns.filter((g) => {
      let match = true;
      if (primaryColor && g.colors[0] !== primaryColor) {
        match = false;
      }
      if (secondaryColor && g.colors[1] !== secondaryColor) {
        match = false;
      }
      if (feature && !g.featureFlags.includes(feature)) {
        match = false;
      }
      if (quality && g.quality !== quality) {
        match = false;
      }
      if (gunClass && g.gunClass !== gunClass) {
        match = false;
      }
      if (shootStyle && gunStatsLookup[g.id].shootStyle !== shootStyle) {
        match = false;
      }
      if (range && gunStatsLookup[g.id].range !== range) {
        match = false;
      }
      return match;
    });

    return res;
  }, [guns, primaryColor, secondaryColor, feature, quality, shootStyle, gunStatsLookup, gunClass, range]);
}
