import clsx from "clsx";
import { Muted } from "@/components/ui/typography";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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

export function ShootStyle({ value }: TShootStyleProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Muted className="font-semibold uppercase">{value}</Muted>
      </TooltipTrigger>
      <TooltipContent side="left" className="w-[410px] text-wrap">
        {Object.entries(shootStyleHelp).map(([s, help]) => (
          <div key={s} className="flex gap-2 mb-1">
            <div className="w-16">
              <img className="w-full h-full object-contain" src={`/shoot-style/${s.toLowerCase()}.gif`} />
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
