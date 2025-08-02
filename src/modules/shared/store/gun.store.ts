import type { TGun } from "@/client/generated/models/gun.model";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

type TGunState = {
  gunLookup: Record<number, TGun>;
  createGunLookup: (guns: TGun[]) => void;
};

export const useGunStore = create<TGunState>()(
  immer((set) => ({
    gunLookup: {},
    createGunLookup: (guns) => {
      set((state) => {
        state.gunLookup = {};
        guns.forEach((gun) => (state.gunLookup[gun.id] = gun));
      });
    },
  })),
);
