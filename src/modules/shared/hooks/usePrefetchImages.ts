import { useEffect, useRef, useState } from "react";

export function usePrefetchImages(imagePaths: string[]) {
  const [isFetched, setIsFetched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const imagePathsRef = useRef(imagePaths);

  useEffect(() => {
    imagePathsRef.current = imagePaths;
  });

  async function prefetchImages() {
    try {
      if (isLoading || isFetched) return;
      setIsLoading(true);
      await Promise.all(
        imagePathsRef.current.map((src) => {
          return new Promise<void>((resolve, reject) => {
            const img = new Image();

            img.src = src;
            img.onerror = () => reject(new Error(`Failed to prefetch: ${src}`));
            img.onload = () => resolve();
          });
        }),
      );
      setIsFetched(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }

  return { isFetched, error, prefetchImages };
}
