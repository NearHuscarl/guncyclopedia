import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";
import { GunService, type TGunStats } from "@/client/service/gun.service";
import type { TGun } from "@/client/generated/models/gun.model";

type TGunState = {
  gunLookup: Record<number, TGun>;
  gunStatsLookup: Record<number, TGunStats>;
  createGunLookup: (guns: TGun[]) => void;
  hoverGunId: number;
  setHoverGun: (id: number) => void;
};

export const useGunStore = create<TGunState>()(
  devtools(
    immer((set) => ({
      gunLookup: {},
      gunStatsLookup: {},
      createGunLookup: (guns) => {
        set(
          (state) => {
            state.gunLookup = {};
            guns.forEach((gun) => {
              state.gunLookup[gun.id] = gun;
              state.gunStatsLookup[gun.id] = GunService.computeGunStats(gun, 0, -1, -1);
            });
          },
          undefined,
          { type: "createGunLookup", guns },
        );
      },
      hoverGunId: -1,
      setHoverGun: (id) => {
        set(
          (state) => {
            state.hoverGunId = id;
          },
          undefined,
          { type: "setHoverGun", id },
        );
      },
    })),
    {
      name: "gunStore",
    },
  ),
);
