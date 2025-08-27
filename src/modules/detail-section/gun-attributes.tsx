import {
  BatteryCharging,
  Biohazard,
  Crosshair,
  Flame,
  Gamepad2,
  Heart,
  Receipt,
  Skull,
  Snail,
  Snowflake,
  WandSparkles,
  Wind,
} from "lucide-react";
import clsx from "clsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NumericValue } from "./numeric-value";
import { formatNumber, toPercent } from "@/lib/lang";
import {
  fuchsia500,
  green500,
  orange500,
  primaryColor,
  red600,
  sky500,
  slate400,
  yellow500,
} from "../shared/settings/tailwind";
import { Penetration } from "@/components/icons/penetration";
import { Bounce } from "@/components/icons/bounce";
import { Stun } from "@/components/icons/stun";
import { Cheese } from "@/components/icons/cheese";
import { FightsabreAttack } from "@/components/icons/fightsabre-attack";
import { BlankDuringReload } from "@/components/icons/blank-during-reload";
import { ActiveReload } from "@/components/icons/active-reload";
import { Sunglasses } from "@/components/icons/sunglasses";
import { Boss } from "@/components/icons/boss";
import { useGunStore } from "../shared/store/gun.store";
import { DamageMultiplier } from "@/components/icons/damage-multiplier";
import { Explosion } from "@/components/icons/explosion";
import { AuraOnReload } from "@/components/icons/aura-on-reload";
import { PlayerBullet } from "@/components/icons/player-bullet";
import { PlayerConvict } from "@/components/icons/player-convict";
import { PlayerCultist } from "@/components/icons/player-cultist";
import { PlayerCultist2 } from "@/components/icons/player-cultist-2";
import { PlayerCosmonaut } from "@/components/icons/player-cosmonaut";
import { PlayerEevee } from "@/components/icons/player-eevee";
import { PlayerGuide } from "@/components/icons/player-guide";
import { PlayerLamey } from "@/components/icons/player-lamey";
import { PlayerMarine } from "@/components/icons/player-marine";
import { PlayerNinja } from "@/components/icons/player-ninja";
import { PlayerRobot } from "@/components/icons/player-robot";
import { PlayerRogue } from "@/components/icons/player-rogue";
import { PlayerSlinger } from "@/components/icons/player-slinger";
import { TrickGun } from "@/components/icons/trick-gun";
import { OilGoop } from "@/components/icons/oil-goop";
import { Dejam } from "@/components/icons/dejam";
import type { ReactNode } from "react";
import type { TGun } from "@/client/generated/models/gun.model";
import type { TGunStats } from "@/client/service/gun.service";
import type { TPlayerName } from "@/client/generated/models/player.model";
import type { TProjectile } from "@/client/generated/models/projectile.model";

const TOOLTIP_DELAY = 100;
const ATTRIBUTE_CLASSES = "gap-0.5 cursor-help!";

type TStatModifier = TGun["playerStatModifiers"][number];
type TStatToBoost = TStatModifier["statToBoost"];

type TStatModifierComponentProps = {
  modifier: TStatModifier;
  className?: string;
  tooltip: ReactNode;
  icon: ReactNode;
};

function createPlayerStatsComponent({ modifier, className, icon, tooltip }: TStatModifierComponentProps) {
  const { modifyType, amount } = modifier;
  return (
    <Tooltip key={modifier.statToBoost} delayDuration={TOOLTIP_DELAY}>
      <TooltipTrigger>
        <div className={clsx("flex items-center", ATTRIBUTE_CLASSES)}>
          <NumericValue className={className}>
            {modifyType === "ADDITIVE" && "+"}
            {modifyType === "MULTIPLICATIVE" ? toPercent(amount) : amount}
          </NumericValue>
          {icon}
        </div>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

const playerStatsComponentLookup: { [K in TStatToBoost]?: (modifier: TStatModifier) => ReactNode } = {
  Curse: (modifier) =>
    createPlayerStatsComponent({
      modifier,
      className: "text-purple-600",
      icon: <Skull size={22} className="text-purple-600" />,
      tooltip: <strong>Curse</strong>,
    }),
  MovementSpeed: (modifier) =>
    createPlayerStatsComponent({
      modifier,
      className: "text-yellow-500",
      icon: <Wind size={22} className="text-yellow-500" />,
      tooltip: <strong>Movement Speed</strong>,
    }),
  GlobalPriceMultiplier: (modifier) =>
    createPlayerStatsComponent({
      modifier,
      className: "text-green-500",
      icon: <Receipt size={22} className="text-green-500" />,
      tooltip: (
        <>
          <strong>Global Price Multiplier</strong>
          <br />
          <span>
            Decreases shop price by <strong>{toPercent(1 - modifier.amount)}</strong>
          </span>
        </>
      ),
    }),
  Coolness: (modifier) =>
    createPlayerStatsComponent({
      modifier,
      className: "text-orange-500",
      icon: <Sunglasses size={22} className="fill-orange-500" />,
      tooltip: <strong>Coolness</strong>,
    }),
  DamageToBosses: (modifier) =>
    createPlayerStatsComponent({
      modifier,
      className: "text-[#C77000]",
      icon: <Boss size={20} />,
      tooltip: (
        <>
          <strong>Damage To Bosses</strong>
          <br />
          <span>
            Deals <strong>{toPercent(modifier.amount)}</strong> damage to bosses.
          </span>
        </>
      ),
    }),
  Health: (modifier) =>
    createPlayerStatsComponent({
      modifier,
      className: "text-red-500",
      icon: <Heart size={20} className="stroke-red-500" />,
      tooltip: (
        <>
          <strong>Health</strong>
          <br />
          <span>
            Adds <strong>{modifier.amount}</strong> empty heart container.
          </span>
        </>
      ),
    }),
  Damage: (modifier) =>
    createPlayerStatsComponent({
      modifier,
      className: "text-teal-500",
      icon: <DamageMultiplier size={20} className="stroke-teal-500" />,
      tooltip: (
        <>
          <strong>Damage</strong>
          <br />
          <span>
            Increase base damage by <strong>{toPercent(modifier.amount - 1)}</strong>.
          </span>
        </>
      ),
    }),
};

function createStatusEffectAttribute(chance: number | undefined, twColor: string, icon: ReactNode, tooltip: ReactNode) {
  if (!chance) return null;

  return (
    <Tooltip delayDuration={TOOLTIP_DELAY}>
      <TooltipTrigger>
        <div className={clsx("flex items-center", ATTRIBUTE_CLASSES)}>
          {chance < 1 && <NumericValue className={twColor}>{toPercent(chance)}</NumericValue>}
          {icon}
        </div>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

const playerLookup: { [key in TPlayerName]?: [string, ReactNode, ReactNode?] } = {
  PlayerGuide: ["The Hunter", <PlayerGuide />],
  PlayerConvict: ["The Convict", <PlayerConvict />],
  PlayerMarine: ["The Marine", <PlayerMarine />],
  PlayerRogue: ["The Pilot", <PlayerRogue />],
  PlayerCoopCultist: ["The Cultist", <PlayerCultist />, <PlayerCultist2 />],
  PlayerBullet: ["The Bullet", <PlayerBullet />],
  PlayerRobot: ["The Robot", <PlayerRobot />],
  PlayerGunslinger: ["The Gunslinger", <PlayerSlinger />],
  PlayerCosmonaut: ["The Cosmonaut", <PlayerCosmonaut />],
  PlayerEevee: ["Eevee", <PlayerEevee />],
  PlayerLamey: ["Lamey", <PlayerLamey />],
  PlayerNinja: ["The Ninja", <PlayerNinja />],
};

type TGunAttributesProps = {
  projectileData: TProjectile;
  gun?: TGun;
  gunStats?: TGunStats;
};

export function GunAttributes({ projectileData, gun, gunStats }: TGunAttributesProps) {
  const setUseChargeAnimation = useGunStore((state) => state.setUseChargeAnimation);
  return (
    <div className="flex gap-3">
      {/* Keep the line height consistent */}
      <div className="flex items-center invisible">
        <NumericValue>{0}</NumericValue>
        <Bounce color="white" size={20} />
      </div>
      {gun?.startingItemOf && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger className={ATTRIBUTE_CLASSES}>
            {gun?.startingItemOf.map((item) => playerLookup[item]?.[1] ?? null)}
          </TooltipTrigger>
          <TooltipContent>
            <strong>Starting Weapon</strong>
            <br />
            This is{" "}
            <strong>
              {gun?.startingItemOf.map((item) => playerLookup[item]?.[0] ?? item.replace("Player", "")).join(", ")}
            </strong>
            's starting gun.
          </TooltipContent>
        </Tooltip>
      )}
      {gun?.startingAlternateItemOf && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger className={ATTRIBUTE_CLASSES}>
            {gun?.startingAlternateItemOf.map((item) => playerLookup[item]?.[2] ?? playerLookup[item]?.[1] ?? null)}
          </TooltipTrigger>
          <TooltipContent>
            <strong>Starting Weapon</strong>
            <br />
            This is{" "}
            <strong>
              {gun?.startingAlternateItemOf
                .map((item) => playerLookup[item]?.[0] ?? item.replace("Player", ""))
                .join(", ")}
            </strong>
            's starting gun when playing as the Player 2 in co-op mode.
          </TooltipContent>
        </Tooltip>
      )}
      {(gunStats?.mode.chargeTime || undefined) && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div
              className={clsx("flex items-center gap-1!", ATTRIBUTE_CLASSES)}
              onMouseEnter={() => setUseChargeAnimation(true)}
              onMouseLeave={() => setUseChargeAnimation(false)}
            >
              <NumericValue className="text-pink-500">{formatNumber(gunStats?.mode.chargeTime ?? 0, 1)}s</NumericValue>
              <BatteryCharging className="text-pink-500" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <strong>Charge Time</strong>
          </TooltipContent>
        </Tooltip>
      )}
      {gun?.playerStatModifiers.map((m) => playerStatsComponentLookup[m.statToBoost]?.(m) || null).filter(Boolean)}
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
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger className={ATTRIBUTE_CLASSES}>
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
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger className={ATTRIBUTE_CLASSES}>
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
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger className={ATTRIBUTE_CLASSES}>
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
      {gun?.attribute.auraOnReload && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div className={clsx("flex items-center", ATTRIBUTE_CLASSES)}>
              {(gun?.attribute.auraOnReloadRadius || undefined) && (
                <NumericValue>{formatNumber(gun?.attribute.auraOnReloadRadius ?? 0, 1)}</NumericValue>
              )}
              <AuraOnReload />
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-wrap w-96">
            <strong>Aura On Reload</strong>
            <br />
            While reloading, a circular field surrounds the player that damages nearby enemies within{" "}
            <strong>{formatNumber(gun?.attribute.auraOnReloadRadius ?? 0, 1)}</strong> radius.
          </TooltipContent>
        </Tooltip>
      )}
      {projectileData.dejam && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div className={ATTRIBUTE_CLASSES}>
              <Dejam />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <strong>Dejammed Projectile</strong>
            <br />
            Turns <strong>Jammed</strong> enemies and bosses back to normal.
          </TooltipContent>
        </Tooltip>
      )}
      {projectileData.mindControl && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div className={ATTRIBUTE_CLASSES}>
              <Gamepad2 size={20} className="stroke-red-500" />
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-wrap w-96">
            <strong>Mind Control Projectile</strong>
            <br />
            Upon hitting an enemy, they will move in the same direction the player moves, and shoot towards the
            crosshair if the player shoots. Their bullets will damage other enemies as well as the player. Bosses cannot
            be controlled.
          </TooltipContent>
        </Tooltip>
      )}
      {projectileData.hasOilGoop && projectileData.spawnGoopOnCollision && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div className={clsx("flex items-center", ATTRIBUTE_CLASSES)}>
              {(Math.floor(projectileData.goopCollisionRadius || 0) || undefined) && (
                <NumericValue className="text-slate-500">
                  {formatNumber(projectileData.goopCollisionRadius!, 1)}
                </NumericValue>
              )}
              <OilGoop size={16} className="[&>path]:fill-slate-500" />
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-wrap w-72">
            <strong>Oil Goop</strong>
            <br />
            {(projectileData.goopCollisionRadius || undefined) && (
              <>
                Projectile leaves behind <strong>oil goop</strong> on collision with the surface, spreading within a
                radius of <strong>{formatNumber(projectileData.goopCollisionRadius!, 1)}</strong>.
              </>
            )}
          </TooltipContent>
        </Tooltip>
      )}
      {(projectileData.chanceToTransmogrify || 0) > 0 && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div className={clsx("flex items-center", ATTRIBUTE_CLASSES)}>
              <NumericValue className={clsx("text-purple-500")}>
                {toPercent(projectileData.chanceToTransmogrify!)}
              </NumericValue>
              <WandSparkles size={16} className={"[&_path]:stroke-purple-500!"} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <strong>Transmogrifying Projectile</strong>
            <br />
            Has <strong>{toPercent(projectileData.chanceToTransmogrify!)}</strong> chance to transmogrify enemies into{" "}
            <strong>{projectileData.transmogrifyTarget}</strong>
          </TooltipContent>
        </Tooltip>
      )}
      {projectileData.isHoming && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div className={clsx("flex items-center", ATTRIBUTE_CLASSES)}>
              {(projectileData.homingRadius || undefined) && (
                <NumericValue>{formatNumber(projectileData.homingRadius!, 0)}</NumericValue>
              )}
              <Crosshair size={18} />
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
      {(projectileData.explosionRadius || undefined) && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div className={clsx("flex items-center", ATTRIBUTE_CLASSES)}>
              <NumericValue className={clsx({ "text-sky-500": projectileData.explosionFreezeRadius })}>
                {formatNumber(projectileData.explosionRadius!, 1)}
              </NumericValue>
              <Explosion
                size={20}
                className={clsx({ "[&_path]:fill-sky-500!": projectileData.explosionFreezeRadius })}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <strong>Explosive Projectile</strong>
            <br />
            Explosion radius: <strong>{formatNumber(projectileData.explosionRadius!, 1)}</strong>
            {(projectileData.explosionFreezeRadius || undefined) && (
              <>
                <br />
                Freeze radius: <strong>{formatNumber(projectileData.explosionFreezeRadius!, 1)}</strong>
              </>
            )}
          </TooltipContent>
        </Tooltip>
      )}
      {(projectileData.penetration || undefined) && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div className={clsx("flex items-center", ATTRIBUTE_CLASSES)}>
              {(Math.floor(projectileData.penetration || 0) || undefined) && (
                <NumericValue>{formatNumber(projectileData.penetration!, 1)}</NumericValue>
              )}
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
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div className={clsx("flex items-center", ATTRIBUTE_CLASSES)}>
              {(Math.floor(projectileData.numberOfBounces || 0) || undefined) && (
                <NumericValue>{formatNumber(projectileData.numberOfBounces!, 1)}</NumericValue>
              )}
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
      {gun?.attribute.trickGun && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div className={ATTRIBUTE_CLASSES}>
              <TrickGun
                size={18}
                color1={gunStats?.mode.mode === "Normal" ? primaryColor : "white"}
                color2={gunStats?.mode.mode === "Alternate" ? primaryColor : "white"}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <strong>Trick Gun</strong>
            <br />
            Alternates between 2 firing modes upon reloading
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
