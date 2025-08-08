import { useSpritesheetStore } from "../store/spritesheet.store";

export function useImageSize(src: string) {
  const size = useSpritesheetStore((state) => state.sheetSize[src]) ?? {};
  const { width = 0, height = 0 } = size;

  return { w: width, h: height };
}
