import { create } from "zustand";

type TImageSize = {
  width: number;
  height: number;
};

type TSpritesheetState = {
  sheetSize: Record<string, TImageSize>;
  addSpritesheet: (texturePath: string, size: TImageSize) => void;
};

export const useSpritesheetStore = create<TSpritesheetState>((set) => ({
  sheetSize: {},
  addSpritesheet: (texturePath: string, size: TImageSize) =>
    set((state) => ({
      ...state,
      sheetSize: {
        ...state.sheetSize,
        [texturePath]: size,
      },
    })),
}));
