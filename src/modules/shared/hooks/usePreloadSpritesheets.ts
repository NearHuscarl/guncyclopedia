import { useEffect, useState } from "react";
import { spritesheetPaths } from "virtual:spritesheets";
import { useSpritesheetStore } from "../store/spritesheet.store";

export function usePreloadSpritesheets() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const addSpritesheet = useSpritesheetStore((state) => state.addSpritesheet);

  useEffect(() => {
    async function preloadImages() {
      try {
        await Promise.all(
          spritesheetPaths.map(({ path: src, width, height }) => {
            addSpritesheet(src, { width, height });
            return new Promise<void>((resolve, reject) => {
              const img = new Image();

              img.src = src;
              img.onerror = () => reject(new Error(`Failed to preload: ${src}`));
              img.onload = () => resolve();
            });
          }),
        );
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      }
    }

    preloadImages();
  }, [addSpritesheet]);

  return { isLoading, error };
}
