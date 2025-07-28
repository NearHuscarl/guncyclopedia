import { useEffect } from "react";
import { useSpritesheetStore } from "./spritesheet.store";

export function useImageSize(src: string) {
  const addSpritesheet = useSpritesheetStore((state) => state.addSpritesheet);
  const { width = 0, height = 0 } = useSpritesheetStore((state) => state.sheetSize[src]) ?? {};

  useEffect(() => {
    const img = new Image();
    img.onload = () => addSpritesheet(src, { width: img.width, height: img.height });
    img.src = src;
  }, [addSpritesheet, src]);

  return { w: width, h: height };
}
