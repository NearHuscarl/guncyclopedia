import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

type TImageSize = {
  width: number;
  height: number;
};

type TSpritesheetState = {
  sheetSize: Record<string, TImageSize>;
  addSpritesheet: (texturePath: string, size: TImageSize) => void;
};

export const useSpritesheetStore = create<TSpritesheetState>()(
  immer((set) => ({
    sheetSize: {},
    addSpritesheet: (texturePath: string, size: TImageSize) =>
      set((state) => {
        state.sheetSize[texturePath] = size;
      }),
  })),
);
