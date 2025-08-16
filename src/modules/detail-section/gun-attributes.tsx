import { Biohazard, Crosshair, Flame, Heart, Snail, Snowflake } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NumericValue } from "./numeric-value";
import { formatNumber, toPercent } from "@/lib/lang";
import { fuchsia500, green500, orange500, red600, sky500, slate400, yellow500 } from "../shared/settings/tailwind";
import { Penetration } from "@/components/icons/penetration";
import { Bounce } from "@/components/icons/bounce";
import { Stun } from "@/components/icons/stun";
import { Cheese } from "@/components/icons/cheese";
import { FightsabreAttack } from "@/components/icons/fightsabre-attack";
import { BlankDuringReload } from "@/components/icons/blank-during-reload";
import type { ReactNode } from "react";
import type { TGun, TProjectile } from "@/client/generated/models/gun.model";
import { ActiveReload } from "@/components/icons/active-reload";

function createStatusEffectAttribute(chance: number | undefined, twColor: string, icon: ReactNode, tooltip: ReactNode) {
  if (!chance) return null;

  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="flex items-center gap-0.5">
          <NumericValue className={twColor}>{toPercent(chance)}</NumericValue>
          {icon}
        </div>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

type TGunAttributesProps = {
  projectileData: TProjectile;
  gun?: TGun;
};

export function GunAttributes({ projectileData, gun }: TGunAttributesProps) {
  return (
    <div className="flex gap-2">
      {/* Keep the line height consistent */}
      <div className="flex items-center invisible">
        <NumericValue>{0}</NumericValue>
        <Bounce color="white" size={20} />
      </div>
      {createStatusEffectAttribute(
        projectileData.poisonChance,
        "text-green-500",
        <Biohazard size={20} color={green500} />,
        <>
          <strong>Poison</strong>
          <br />
          Projectile has <strong>{toPercent(projectileData.poisonChance || 0)}</strong> chance to poison an enemy for{" "}
          <strong>{formatNumber(projectileData.poisonDuration || 0, 1)}s</strong>.
        </>,
      )}
      {createStatusEffectAttribute(
        projectileData.charmChance,
        "text-fuchsia-500",
        <Heart size={20} color={fuchsia500} />,
        <>
          <strong>Charm</strong>
          <br />
          Projectile has <strong>{toPercent(projectileData.charmChance || 0)}</strong> chance to charm an enemy for{" "}
          <strong>{formatNumber(projectileData.charmDuration || 0, 1)}s</strong>.
        </>,
      )}
      {createStatusEffectAttribute(
        projectileData.freezeChance,
        "text-sky-500",
        <Snowflake size={20} color={sky500} />,
        <>
          <strong>Freeze</strong>
          <br />
          Projectile has <strong>{toPercent(projectileData.freezeChance || 0)}</strong> chance to freeze an enemy for{" "}
          <strong>{formatNumber(projectileData.freezeDuration || 0, 1)}s</strong>.
          <br />
          Freeze amount: <strong>{projectileData.freezeAmount}</strong>
        </>,
      )}
      {createStatusEffectAttribute(
        projectileData.fireChance,
        "text-red-600",
        <Flame size={20} color={red600} />,
        <>
          <strong>Fire</strong>
          <br />
          Projectile has <strong>{toPercent(projectileData.fireChance || 0)}</strong> chance to burn an enemy for{" "}
          <strong>{formatNumber(projectileData.fireDuration || 0, 1)}s</strong>.
        </>,
      )}
      {createStatusEffectAttribute(
        projectileData.stunChance,
        "text-slate-400",
        <Stun size={20} color={slate400} />,
        <>
          <strong>Stun</strong>
          <br />
          Projectile has <strong>{toPercent(projectileData.stunChance || 0)}</strong> chance to stun an enemy for{" "}
          <strong>{formatNumber(projectileData.stunDuration || 0, 1)}s</strong>.
        </>,
      )}
      {createStatusEffectAttribute(
        projectileData.speedChance,
        "text-orange-500",
        <Snail size={20} color={orange500} />,
        <>
          <strong>Slow</strong>
          <br />
          Projectile has <strong>{toPercent(projectileData.speedChance || 0)}</strong> chance to slow down an enemy by{" "}
          <strong>{toPercent(1 - projectileData.speedMultiplier!)}</strong> for{" "}
          <strong>{formatNumber(projectileData.speedDuration || 0, 1)}s</strong>.
        </>,
      )}
      {createStatusEffectAttribute(
        projectileData.cheeseChance,
        "text-yellow-500",
        <Cheese size={20} color={yellow500} />,
        <>
          <strong>Cheese</strong>
          <br />
          Projectile has <strong>{toPercent(projectileData.cheeseChance || 0)}</strong> chance to encheese an enemy for{" "}
          <strong>{formatNumber(projectileData.cheeseDuration || 0, 1)}s</strong>
          .<br />
          Cheese amount: <strong>{projectileData.cheeseAmount}</strong>
        </>,
      )}
      {gun?.attribute.activeReload && (
        <Tooltip>
          <TooltipTrigger>
            <ActiveReload />
          </TooltipTrigger>
          <TooltipContent className="text-wrap w-96">
            <strong>Active Reload</strong>
            <br />
            Pressing reload or firing at the right time will increase the gun's damage. Each successful reload will also
            make the reload time shorter, making another successful reload harder to pull off.
          </TooltipContent>
        </Tooltip>
      )}
      {gun?.attribute.blankDuringReload && (
        <Tooltip>
          <TooltipTrigger>
            <BlankDuringReload />
          </TooltipTrigger>
          <TooltipContent className="text-wrap">
            <strong>Blank During Reload</strong>
            <br />
            Destroy bullets during reload for <strong>{gun.reloadTime}s</strong> within{" "}
            <strong>{gun.attribute.blankReloadRadius}</strong> radius.
          </TooltipContent>
        </Tooltip>
      )}
      {gun?.attribute.reflectDuringReload && (
        <Tooltip>
          <TooltipTrigger>
            <FightsabreAttack />
          </TooltipTrigger>
          <TooltipContent className="text-wrap">
            <strong>Reflect During Reload</strong>
            <br />
            Reflect bullets during reload for <strong>{gun.reloadTime}s</strong> within{" "}
            <strong>{gun.attribute.blankReloadRadius}</strong> radius.
            <br />
            Reflected bullets deal <strong>{gun.attribute.reflectDuringReloadDmgModifier! * 100}%</strong> more damage.
          </TooltipContent>
        </Tooltip>
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
            <strong>Homing Projectile</strong>
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
            <strong>Piercing Projectile</strong>
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
            <strong>Bouncing Projectile</strong>
            <br />
            Number of bounces: <strong>{formatNumber(projectileData.numberOfBounces!, 1)}</strong>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
