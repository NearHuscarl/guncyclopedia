import isUndefined from "lodash/isUndefined";
import { useGunStore } from "../shared/store/gun.store";
import { AnimatedSpriteSeries } from "../shared/components/animated-sprite-series";
import { AnimatedSprite } from "../shared/components/animated-sprite";
import type { TGun } from "@/client/generated/models/gun.model";

// Sometimes the reload animation is cooler than the intro one.
const forceUseReloadAsIntroAnimation = new Set([387]);

export function GunPortrait({ gun, mode }: { gun: TGun; mode: string }) {
  const portraitAnimation = useGunStore((state) => state.portraitAnimation);

  if (gun.attribute.trickGun) {
    return (
      <AnimatedSpriteSeries
        key={`${gun.id}-${mode}`}
        scale={6}
        animations={(mode === "Alternate"
          ? [gun.animation.reload, gun.animation.alternateIdle]
          : [gun.animation.alternateReload, gun.animation.idle]
        ).filter((a) => !isUndefined(a))}
      />
    );
  }

  if (portraitAnimation !== "idle") {
    const animation = gun.animation[portraitAnimation] ?? gun.animation.idle; // gamma ray doesn't have charge & shooting anim
    return <AnimatedSprite key={`${gun.id}-${portraitAnimation}`} scale={6} animation={animation} />;
  }

  const introAnimation = forceUseReloadAsIntroAnimation.has(gun.id)
    ? gun.animation.reload
    : (gun.animation.intro ?? gun.animation.reload);

  return (
    <AnimatedSpriteSeries
      key={`${gun.id}-idle`}
      scale={6}
      // TODO: moonscraper charge animation doesn't exist
      animations={[introAnimation, gun.animation.idle].filter((a) => !isUndefined(a))}
    />
  );
}
