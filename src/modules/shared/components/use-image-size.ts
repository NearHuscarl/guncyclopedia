import { useEffect } from "react";
import { useSpritesheetStore } from "../store/spritesheet.store";

export function useImageSize(src: string) {
  const addSpritesheet = useSpritesheetStore((state) => state.addSpritesheet);
  const setIsLoading = useSpritesheetStore((state) => state.setIsLoading);
  const { size } = useSpritesheetStore((state) => state.sheetSize[src]) ?? {};
  const { width = 0, height = 0 } = size ?? {};

  useEffect(() => {
    const isLoading = useSpritesheetStore.getState().sheetSize[src]?.isLoading ?? false;
    if ((width !== 0 && height !== 0) || isLoading) return;

    setIsLoading(src, true);

    const img = new Image();
    img.onload = () => {
      console.log(`Loaded image size for ${src}: ${img.width}x${img.height}`);
      return addSpritesheet(src, { width: img.width, height: img.height });
    };
    img.src = src;
  }, [addSpritesheet, src, width, height, setIsLoading]);

  return { w: width, h: height };
}

// export function useImageSize(src: string) {
//   const addSpritesheet = useSpritesheetStore((state) => state.addSpritesheet);
//   const { width = 0, height = 0 } = useSpritesheetStore((state) => state.sheetSize[src]) ?? {};

//   useEffect(() => {
//     // if (width !== -1 && height !== -1) return; // Already loaded

//     const img = new Image();
//     img.src = src;
//     img.onload = () => addSpritesheet(src, { width: img.width, height: img.height });
//   }, [src, width, height]);

//   return { w: width, h: height };
// }
