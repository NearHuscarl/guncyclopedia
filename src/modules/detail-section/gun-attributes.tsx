import { Biohazard, Crosshair, Flame, Heart, Snail, Snowflake } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NumericValue } from "./numeric-value";
import { formatNumber } from "@/lib/lang";
import { fuchsia500, green500, orange500, red600, sky500, slate400, yellow500 } from "../shared/settings/tailwind";
import { Penetration } from "@/components/icons/penetration";
import { Bounce } from "@/components/icons/bounce";
import type { TProjectile } from "@/client/generated/models/gun.model";
import type { ReactNode } from "react";
import { Stun } from "@/components/icons/stun";
import { Cheese } from "@/components/icons/cheese";

function createStatusEffectAttribute(
  chance: number | undefined,
  duration: number,
  effectName: string,
  twColor: string,
  icon: ReactNode,
  extraTooltipContent?: ReactNode,
) {
  if (!chance) return null;

  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="flex items-center gap-0.5">
          <NumericValue className={twColor}>{formatNumber(chance * 100, 0)}%</NumericValue>
          {icon}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <strong>{formatNumber(chance * 100, 0)}%</strong> chance to <strong>{effectName}</strong> an enemy after each
        shot for <strong>{formatNumber(duration, 1)}s</strong>.<br />
        {extraTooltipContent}
      </TooltipContent>
    </Tooltip>
  );
}

type TGunAttributesProps = {
  projectileData: TProjectile;
};

export function GunAttributes({ projectileData }: TGunAttributesProps) {
  return (
    <div className="flex gap-2">
      {/* Keep the line height consistent */}
      <div className="flex items-center invisible">
        <NumericValue>{0}</NumericValue>
        <Bounce color="white" size={20} />
      </div>
      {createStatusEffectAttribute(
        projectileData.poisonChance,
        projectileData.poisonDuration!,
        "poison",
        "text-green-500",
        <Biohazard size={20} color={green500} />,
      )}
      {createStatusEffectAttribute(
        projectileData.charmChance,
        projectileData.charmDuration!,
        "charm",
        "text-fuchsia-500",
        <Heart size={20} color={fuchsia500} />,
      )}
      {createStatusEffectAttribute(
        projectileData.freezeChance,
        projectileData.freezeDuration!,
        "freeze",
        "text-sky-500",
        <Snowflake size={20} color={sky500} />,
        <>
          Freeze amount: <strong>{projectileData.freezeAmount}</strong>
        </>,
      )}
      {createStatusEffectAttribute(
        projectileData.fireChance,
        projectileData.fireDuration!,
        "burn",
        "text-red-600",
        <Flame size={20} color={red600} />,
      )}
      {createStatusEffectAttribute(
        projectileData.stunChance,
        projectileData.stunDuration!,
        "stun",
        "text-slate-400",
        <Stun size={20} color={slate400} />,
      )}
      {createStatusEffectAttribute(
        projectileData.speedChance,
        projectileData.speedDuration!,
        "slow down",
        "text-orange-500",
        <Snail size={20} color={orange500} />,
        <>
          Slow down enemy by <strong>{formatNumber((1 - projectileData.speedMultiplier!) * 100, 0)}%</strong>
        </>,
      )}
      {createStatusEffectAttribute(
        projectileData.cheeseChance,
        projectileData.cheeseDuration!,
        "encheese",
        "text-yellow-500",
        <Cheese size={20} color={yellow500} />,
        <>
          Cheese amount: <strong>{projectileData.cheeseAmount}</strong>
        </>,
      )}
      {projectileData.isHoming && (
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center gap-1">
              {(projectileData.homingRadius || undefined) && (
                <NumericValue>{formatNumber(projectileData.homingRadius!, 0)}</NumericValue>
              )}
              <Crosshair size={20} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            Homing projectile.
            <br />
            {(projectileData.homingRadius || undefined) && (
              <>
                Homing radius: <strong>{formatNumber(projectileData.homingRadius!, 0)}</strong>
              </>
            )}
          </TooltipContent>
        </Tooltip>
      )}
      {(projectileData.penetration || undefined) && (
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center gap-1">
              <NumericValue>{formatNumber(projectileData.penetration!, 1)}</NumericValue>
              <Penetration size={20} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            Piercing projectile.
            <br />
            Number of penetration: <strong>{formatNumber(projectileData.penetration!, 1)}</strong>
          </TooltipContent>
        </Tooltip>
      )}
      {(projectileData.numberOfBounces || undefined) && (
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center gap-1">
              <NumericValue>{formatNumber(projectileData.numberOfBounces!, 1)}</NumericValue>
              <Bounce color="white" size={20} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            Number of bounces: <strong>{formatNumber(projectileData.numberOfBounces!, 1)}</strong>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
