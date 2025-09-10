import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";
import { GunService, type TGunStats } from "@/client/service/gun.service";
import type { TGun } from "@/client/generated/models/gun.model";

declare global {
  var __gunStore__: ReturnType<typeof createGunStore> | undefined;
}

type TGunAnimationName = keyof TGun["animation"];

type TGunState = {
  gunLookup: Record<number, TGun>;
  gunStatsLookup: Record<number, TGunStats>;
  createGunLookup: (guns: TGun[]) => void;
  hoverGunId: number;
  setHoverGun: (id: number) => void;
  portraitAnimation: TGunAnimationName;
  setPortraitAnimation: (animationName: TGunAnimationName) => void;
};

function createGunStore() {
  return create<TGunState>()(
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
                const modeIndex = GunService.hasChargeMode(gun) ? gun.projectileModes.length - 1 : 0;
                state.gunStatsLookup[gun.id] = GunService.computeGunStats(gun, modeIndex, -1, -1);
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
        portraitAnimation: "idle",
        setPortraitAnimation: (animationName) => {
          set(
            (state) => {
              state.portraitAnimation = animationName;
            },
            undefined,
            { type: "setPortraitAnimation", animationName },
          );
        },
      })),
      {
        name: "gunStore",
        enabled: true,
      },
    ),
  );
}

function initGunStore() {
  // Reuse the same instance across HMR
  if (globalThis.__gunStore__) {
    return globalThis.__gunStore__;
  }

  if (import.meta.hot) {
    return (globalThis.__gunStore__ = createGunStore());
  }

  return createGunStore();
}

export const useGunStore = initGunStore();
