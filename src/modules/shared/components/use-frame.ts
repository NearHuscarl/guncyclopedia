import { useEffect, useState } from "react";
import { randomBetween } from "@/lib/lang";
import type { TAnimation } from "@/client/generated/models/animation.model";

export function useFrame(animation: TAnimation) {
  const startIndex = animation.wrapMode === "LoopSection" ? animation.loopStart : 0;
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    if (animation.frames.length === 1) return;

    let timerId: number;
    const scheduleNext = (current: number) => {
      const lastFrame = current === animation.frames.length - 1;

      // Calculate delay before showing the *next* frame
      const delay =
        animation.wrapMode === "LoopFidget" && lastFrame
          ? // finished a full cycle → pause for random fidget duration
            randomBetween(animation.minFidgetDuration, animation.maxFidgetDuration) * 1000
          : // normal per-frame delay
            1000 / animation.fps;

      timerId = window.setTimeout(() => {
        setIndex((prev) => (prev + 1 === animation.frames.length ? startIndex : prev + 1));
      }, delay);
    };

    scheduleNext(index);

    return () => window.clearTimeout(timerId);
  }, [
    animation.name,
    animation.fps,
    animation.frames.length,
    animation.maxFidgetDuration,
    animation.minFidgetDuration,
    animation.wrapMode,
    index,
    startIndex,
  ]);

  return animation.frames[index];
}
