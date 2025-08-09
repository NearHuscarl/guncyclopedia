import { AmmoIcon } from "@/components/icons/ammo";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { TProjectilePerShot } from "@/client/generated/models/gun.model";

type TShootingStyleProps = {
  shootingStyle: TProjectilePerShot["shootStyle"];
  magazineSize: number;
};

const weight: Record<TProjectilePerShot["shootStyle"], number> = {
  Charged: 1,
  Burst: 2,
  SemiAutomatic: 2,
  Beam: 3,
  Automatic: 3,
};

export function ShootingStyle({ shootingStyle, magazineSize }: TShootingStyleProps) {
  const score = magazineSize === 1 ? 1 : weight[shootingStyle];

  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="flex relative">
          <AmmoIcon color={score >= 1 ? "white" : undefined} />
          <AmmoIcon color={score >= 2 ? "white" : undefined} />
          <AmmoIcon color={score === 3 ? "white" : undefined} />
        </div>
      </TooltipTrigger>
      <TooltipContent className="text-wrap">
        Each highlighted ammo icon represents a different shooting style:
        <ul>
          <li>
            1 - Charged OR <strong>Single Shot</strong>
          </li>
          <li>2 - Burst / Semi-Automatic</li>
          <li>3 - Beam / Automatic</li>
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}
