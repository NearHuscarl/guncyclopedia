import { create } from "zustand";

type TUiState = {
  selectedItemId: number;
  selectItem: (itemId: number) => void;
};

export const useUiStore = create<TUiState>((set) => ({
  selectedItemId: -1,
  selectItem: (itemId: number) => set({ selectedItemId: itemId }),
}));
