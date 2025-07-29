import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

type TImageSize = {
  width: number;
  height: number;
};

type TSpritesheetState = {
  sheetSize: Record<string, { isLoading: boolean; size: TImageSize }>;
  addSpritesheet: (texturePath: string, size: TImageSize) => void;
  setIsLoading: (texturePath: string, isLoading: boolean) => void;
};

export const useSpritesheetStore = create<TSpritesheetState>()(
  immer((set) => ({
    sheetSize: {},
    setIsLoading: (texturePath: string, isLoading: boolean) => {
      set((state) => void (state.sheetSize[texturePath] = { isLoading, size: { width: 0, height: 0 } }));
    },
    addSpritesheet: (texturePath: string, size: TImageSize) =>
      set((state) => {
        state.sheetSize[texturePath] = { isLoading: false, size };
      }),
  })),
);
