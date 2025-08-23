import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Muted } from "@/components/ui/typography";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { usePrefetchImages } from "../shared/hooks/usePrefetchImages";
import { useUnmountRef } from "@/lib/hooks";
import { type TProjectilePerShot } from "@/client/generated/models/gun.model";

type TShootStyleProps = {
  value: TProjectilePerShot["shootStyle"];
};

const shootStyleHelp: Record<TProjectilePerShot["shootStyle"], string> = {
  Automatic: "Automatically fires bullets at a constant rate while the fire key is held.",
  SemiAutomatic:
    "Fires bullets at a constant rate while the fire key is held. Tapping the fire key however allows the gun to fire faster.",
  Charged: "Requires the fire button to be held for a time and released to fire a single volley.",
  Beam: "Fires a continuous beam as long as the fire key is held.",
  Burst: "Similar to Automatic but fire a bursts of multiple projectiles in a short time before the normal cooldown.",
};

function getImageSrc(shootStyle: string) {
  return `/shoot-style/${shootStyle.toLowerCase()}.gif`;
}

export function ShootStyle({ value }: TShootStyleProps) {
  const { isFetched: imagesReady, prefetchImages } = usePrefetchImages(Object.keys(shootStyleHelp).map(getImageSrc));
  const [hoverReady, setHoverReady] = useState(false);
  const timerRef = useRef<number>(undefined);
  const [open, setOpen] = useState(false);
  const unmountRef = useUnmountRef();

  const startHover = () => {
    window.clearTimeout(timerRef.current);
    setHoverReady(false);
    timerRef.current = window.setTimeout(() => !unmountRef.current && setHoverReady(true), 700);

    if (!imagesReady) {
      prefetchImages();
    }
  };
  const endHover = () => {
    window.clearTimeout(timerRef.current);
    setHoverReady(false);
    setOpen(false);
  };

  useEffect(() => {
    setOpen(hoverReady && imagesReady);
  }, [hoverReady, imagesReady]);

  return (
    <Tooltip
      open={open}
      // Also close if user scrolls/escapes, Radix will call onOpenChange(false)
      onOpenChange={(next) => !next && setOpen(false)}
    >
      <TooltipTrigger asChild>
        <Muted
          className="font-semibold uppercase cursor-help"
          onPointerEnter={startHover}
          onFocus={startHover}
          onPointerLeave={endHover}
          onBlur={endHover}
        >
          {value}
        </Muted>
      </TooltipTrigger>
      <TooltipContent side="left" className="w-[410px] text-wrap">
        {Object.entries(shootStyleHelp).map(([s, help]) => (
          <div key={s} className="flex gap-2 mb-1">
            <div className="w-16">
              <img className="w-full h-full object-contain" src={getImageSrc(s)} />
            </div>
            <div className="flex-1">
              <Muted
                className={clsx({
                  "font-semibold uppercase": true,
                  "text-primary": value === s,
                })}
              >
                {s}
              </Muted>
              <div>{help}</div>
            </div>
          </div>
        ))}
      </TooltipContent>
    </Tooltip>
  );
}
