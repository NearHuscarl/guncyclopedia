import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

type TUiState = {
  selectedItemId: number;
  gun: {
    sortBy: "none" | "quality" | "maxAmmo" | "cooldownTime";
  };
  selectItem: (itemId: number) => void;
  setSortBy: (sortBy: TUiState["gun"]["sortBy"]) => void;
};

export const useUiStore = create<TUiState>()(
  immer((set) => ({
    selectedItemId: -1,
    gun: {
      sortBy: "none",
    },
    selectItem: (itemId: number) => set({ selectedItemId: itemId }),
    setSortBy: (sortBy: TUiState["gun"]["sortBy"]) =>
      set((state) => {
        state.gun.sortBy = sortBy;
      }),
  })),
);
