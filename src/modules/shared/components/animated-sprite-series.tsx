import type { TAnimation } from "@/client/generated/models/animation.model";
import { useState } from "react";
import { AnimatedSprite } from "./animated-sprite";

type TAnimatedSpriteSeriesProps = { animations: TAnimation[]; scale?: number; className?: string };

export function AnimatedSpriteSeries({ animations, className, scale }: TAnimatedSpriteSeriesProps) {
  const [animationIndex, setAnimationIndex] = useState(0);

  return (
    <AnimatedSprite
      key={animationIndex}
      animation={animations[animationIndex]}
      scale={scale}
      className={className}
      onFinished={() => {
        if (animationIndex < animations.length - 1) {
          setAnimationIndex(animationIndex + 1);
        }
      }}
    />
  );
}
