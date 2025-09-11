import {
  BatteryCharging,
  Biohazard,
  Flame,
  Gamepad2,
  Heart,
  Keyboard,
  Move,
  Receipt,
  Skull,
  Snail,
  Snowflake,
  SquareAsterisk,
  WandSparkles,
  Wind,
} from "lucide-react";
import clsx from "clsx";
import startCase from "lodash/startCase";
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
import { WaveProjectiles } from "@/components/icons/wave-projectiles";
import { AntimatterProjectile } from "@/components/icons/antimatter-projectile";
import { BlankOnCollision } from "@/components/icons/blank-on-collision";
import { Sticky } from "@/components/icons/sticky";
import { Devolver } from "@/components/icons/devolver";
import { IgnoreDamageCap } from "@/components/icons/ignore-damage-cap";
import { Blackhole } from "@/components/icons/blackhole";
import { SpawnModifier } from "@/components/icons/spawn-modifier";
import { Homing } from "@/components/icons/homing";
import { Homing2 } from "@/components/icons/homing2";
import { Bee } from "@/components/icons/bee";
import { Chest } from "@/components/icons/chest";
import { HomingLevel, ProjectileService } from "@/client/service/projectile.service";
import { AmmoIcon } from "@/components/icons/ammo";
import { DamageAllEnemiesRadius } from "@/client/generated/models/projectile.model";
import { LifeOrb } from "@/components/icons/life-orb";
import { Three } from "@/components/icons/three";
import type { ReactNode } from "react";
import type { TGun } from "@/client/generated/models/gun.model";
import type { TPlayerName } from "@/client/generated/models/player.model";
import type { TResolvedProjectile } from "@/client/service/game-object.service";
import type { TGunStats } from "@/client/service/gun.service";

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
  projectile: TResolvedProjectile;
  gun?: TGun;
  gunStats?: TGunStats;
};

export function GunAttributes({ projectile, gun, gunStats }: TGunAttributesProps) {
  const setPortraitAnimation = useGunStore((state) => state.setPortraitAnimation);
  const homingLevel = ProjectileService.getHomingLevel(projectile);

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
              onMouseEnter={() => setPortraitAnimation("charge")}
              onMouseLeave={() => setPortraitAnimation("idle")}
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
        projectile.charmChance,
        "text-fuchsia-500",
        <Heart size={20} color={fuchsia500} />,
        <>
          <strong>Charm</strong>
          <br />
          Projectile has <strong>{toPercent(projectile.charmChance || 0)}</strong> chance to charm an enemy for{" "}
          <strong>{formatNumber(projectile.charmDuration || 0, 1)}s</strong>.
        </>,
      )}
      {createStatusEffectAttribute(
        projectile.fireChance,
        "text-red-600",
        <Flame size={18} color={red600} />,
        <>
          <strong>Fire</strong>
          <br />
          Projectile has <strong>{toPercent(projectile.fireChance || 0)}</strong> chance to burn an enemy for{" "}
          <strong>{formatNumber(projectile.fireDuration || 0, 1)}s</strong>.
        </>,
      )}
      {createStatusEffectAttribute(
        projectile.speedChance,
        "text-orange-500",
        <Snail size={20} color={orange500} />,
        <>
          <strong>Slow</strong>
          <br />
          Projectile has <strong>{toPercent(projectile.speedChance || 0)}</strong> chance to slow down an enemy by{" "}
          <strong>{toPercent(1 - projectile.speedMultiplier!)}</strong> for{" "}
          <strong>{formatNumber(projectile.speedDuration || 0, 1)}s</strong>.
        </>,
      )}
      {createStatusEffectAttribute(
        projectile.poisonChance,
        "text-green-500",
        <Biohazard size={20} color={green500} />,
        <>
          <strong>Poison</strong>
          <br />
          Projectile has <strong>{toPercent(projectile.poisonChance || 0)}</strong> chance to poison an enemy for{" "}
          <strong>{formatNumber(projectile.poisonDuration || 0, 1)}s</strong>.
        </>,
      )}
      {createStatusEffectAttribute(
        projectile.freezeChance,
        "text-sky-500",
        <Snowflake size={20} color={sky500} />,
        <>
          <strong>Freeze</strong>
          <br />
          Projectile has <strong>{toPercent(projectile.freezeChance || 0)}</strong> chance to freeze an enemy for{" "}
          <strong>{formatNumber(projectile.freezeDuration || 0, 1)}s</strong>.
          <br />
          Freeze amount: <strong>{projectile.freezeAmount}</strong>
        </>,
      )}
      {createStatusEffectAttribute(
        projectile.stunChance,
        "text-slate-400",
        <Stun size={20} color={slate400} />,
        <>
          <strong>Stun</strong>
          <br />
          Projectile has <strong>{toPercent(projectile.stunChance || 0)}</strong> chance to stun an enemy for{" "}
          <strong>{formatNumber(projectile.stunDuration || 0, 1)}s</strong>.
        </>,
      )}
      {createStatusEffectAttribute(
        projectile.cheeseChance,
        "text-yellow-500",
        <Cheese size={20} color={yellow500} />,
        <>
          <strong>Cheese</strong>
          <br />
          Projectile has <strong>{toPercent(projectile.cheeseChance || 0)}</strong> chance to encheese an enemy for{" "}
          <strong>{formatNumber(projectile.cheeseDuration || 0, 1)}s</strong>
          .<br />
          Cheese amount: <strong>{projectile.cheeseAmount}</strong>
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
      {gun?.name === "Directional Pad" && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div className={clsx("flex items-center", ATTRIBUTE_CLASSES)}>
              <Move size={17} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <strong>4 Directions</strong>
            <br />
            Fires projectiles in four directions.
          </TooltipContent>
        </Tooltip>
      )}
      {gun?.attribute.spawnChestOnDepletion && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div className={clsx("flex items-center", ATTRIBUTE_CLASSES)}>
              <Chest size={18} />
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-wrap w-72">
            <strong>Spawn Chest On Depletion</strong>
            <br />
            When running out of ammo, the gun is destroyed and spawns a chest of any quality.
          </TooltipContent>
        </Tooltip>
      )}
      {gun?.attribute.inputCombo && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div className={clsx("flex items-center", ATTRIBUTE_CLASSES)}>
              <Keyboard
                size={20}
                className={clsx({
                  "[&_path,&_rect]:stroke-muted-foreground [&_path,&_rect]:transition-colors": true,
                  "[&_path,&_rect]:stroke-yellow-500!": gunStats?.mode.mode === "← ←",
                  "[&_path,&_rect]:stroke-blue-500!": gunStats?.mode.mode === "↓ →",
                })}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-wrap w-96">
            <strong>Input Combos</strong>
            <br />- Pressing <strong>down</strong>, then <strong>right</strong>, then fire will cause the gun to fire 4
            additional fireballs.
            <br />- Pressing <strong>left</strong>, then <strong>left</strong> again, then fire will cause the gun to
            fire a grappling hook.
          </TooltipContent>
        </Tooltip>
      )}
      {gun?.attribute.lifeOrb && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div
              className={clsx("flex items-center", ATTRIBUTE_CLASSES)}
              onMouseEnter={() => setPortraitAnimation("lifeOrbFullIdle")}
              onMouseLeave={() => setPortraitAnimation("idle")}
            >
              <LifeOrb size={20} />
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-wrap w-96">
            <strong>Soul Damage</strong>
            <br />
            After killing an enemy, pressing the reload button deals <strong>soul damage</strong> to every enemy in the
            room. The damage is equal to the amount of damage Life Orb dealt to the last enemy killed.
          </TooltipContent>
        </Tooltip>
      )}
      {(projectile.isBee || undefined) && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div className={ATTRIBUTE_CLASSES}>
              <Bee size={18} />
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-wrap w-80">
            <strong>Bee Projectile</strong>
            <br />
            Has homing behavior but slows down when facing the opposite of the enemy, and speeds up after aligning with
            the target.
            <br />
            Deals extra sting damage for <strong>{projectile.beeStingDuration}s</strong>.
          </TooltipContent>
        </Tooltip>
      )}
      {(projectile.helixAmplitude || undefined) && !projectile.antimatter && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div className={ATTRIBUTE_CLASSES}>
              <WaveProjectiles />
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-wrap w-72">
            <strong>Helix Projectile</strong>
            <br />
            Fires two projectiles in opposite wave patterns, meeting and diverging as they travel.
            <br />
            Wave length: <strong>{projectile.helixWavelength}</strong>, Wave amplitude:{" "}
            <strong>{projectile.helixAmplitude}</strong>
          </TooltipContent>
        </Tooltip>
      )}
      {(projectile.helixAmplitude || undefined) && projectile.antimatter && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div className={ATTRIBUTE_CLASSES}>
              <AntimatterProjectile />
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-wrap w-96">
            <strong>Antimatter Projectile</strong>
            <br />
            Fires two projectiles in opposite wave patterns. When colliding, they cause a large explosion and trigger a
            blank effect.
            <br />
            Wave length: <strong>{projectile.helixWavelength}</strong>, Wave amplitude:{" "}
            <strong>{projectile.helixAmplitude}</strong>
          </TooltipContent>
        </Tooltip>
      )}
      {projectile.blankOnCollision && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div className={ATTRIBUTE_CLASSES}>
              <BlankOnCollision />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <strong>Blank Projectile</strong>
            <br />
            Triggers a blank effect on collision
          </TooltipContent>
        </Tooltip>
      )}
      {projectile.dejam && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div className={ATTRIBUTE_CLASSES}>
              <Dejam />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <strong>Dejam Projectile</strong>
            <br />
            Turns <strong>Jammed</strong> enemies and bosses back to normal.
          </TooltipContent>
        </Tooltip>
      )}
      {projectile.sticky && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div className={ATTRIBUTE_CLASSES}>
              <Sticky size={20} />
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-wrap w-72">
            <strong>Sticky Grenade</strong>
            <br />
            Projectile sticks to the enemy. It explodes upon reloading or switching weapons.
          </TooltipContent>
        </Tooltip>
      )}
      {projectile.mindControl && (
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
      {projectile.ignoreDamageCaps && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div className={ATTRIBUTE_CLASSES}>
              <IgnoreDamageCap size={20} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <strong>Ignore Damage Caps</strong>
            <br />
            Projectiles ignore boss damage caps.
          </TooltipContent>
        </Tooltip>
      )}
      {projectile.hasOilGoop && projectile.spawnGoopOnCollision && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div className={clsx("flex items-center", ATTRIBUTE_CLASSES)}>
              {(Math.floor(projectile.goopCollisionRadius || 0) || undefined) && (
                <NumericValue className="text-slate-500">
                  {formatNumber(projectile.goopCollisionRadius!, 1)}
                </NumericValue>
              )}
              <OilGoop size={16} className="[&>path]:fill-slate-500" />
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-wrap w-72">
            <strong>Oil Goop</strong>
            <br />
            {(projectile.goopCollisionRadius || undefined) && (
              <>
                Projectile leaves behind <strong>oil goop</strong> on collision with the surface, spreading within a
                radius of <strong>{formatNumber(projectile.goopCollisionRadius!, 1)}</strong>.
              </>
            )}
          </TooltipContent>
        </Tooltip>
      )}
      {(projectile.chanceToTransmogrify || 0) > 0 && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div className={clsx("flex items-center", ATTRIBUTE_CLASSES)}>
              <NumericValue className={clsx("text-purple-500")}>
                {toPercent(projectile.chanceToTransmogrify!)}
              </NumericValue>
              <WandSparkles size={16} className={"[&_path]:stroke-purple-500!"} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <strong>Transmogrifying Projectile</strong>
            <br />
            Has <strong>{toPercent(projectile.chanceToTransmogrify!)}</strong> chance to transmogrify enemies into{" "}
            <strong>{projectile.transmogrifyTarget}</strong>
          </TooltipContent>
        </Tooltip>
      )}
      {(projectile.devolveChance || undefined) && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div className={ATTRIBUTE_CLASSES}>
              <Devolver />
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-wrap w-72">
            <strong>Devolve Projectile</strong>
            <br />
            Projectile has <strong>{toPercent(projectile.devolveChance || 0)}</strong> chance to devolve an enemy to{" "}
            <strong>{startCase(projectile.devolveTarget)}</strong>.
          </TooltipContent>
        </Tooltip>
      )}
      {projectile.wishesToBuff && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div className={ATTRIBUTE_CLASSES}>
              <Three size={20} className={"[&_path]:fill-yellow-500!"} />
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-wrap w-72">
            <strong>Three Wishes Buff</strong>
            <br />
            Hitting an enemy <strong>{projectile.wishesToBuff}</strong> times causes a genie to punch them, dealing
            extremely high damage.
          </TooltipContent>
        </Tooltip>
      )}
      {projectile.isBlackhole && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div className={clsx("flex items-center", ATTRIBUTE_CLASSES)}>
              <Blackhole size={18} className={"[&_path]:fill-purple-500!"} />
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-wrap w-96">
            <strong>Blackhole Projectile</strong>
            <br />
            Attracts enemies and bullets towards it while dealing continuous damage to the enemies at the center.
          </TooltipContent>
        </Tooltip>
      )}
      {(projectile.damageAllEnemies || gun?.attribute.lifeOrb) && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div className={clsx("flex items-center", ATTRIBUTE_CLASSES)}>
              {projectile.damageAllEnemiesMaxTargets !== -1 && (
                <NumericValue className={clsx("text-orange-500")}>{projectile.damageAllEnemiesMaxTargets}</NumericValue>
              )}
              <SquareAsterisk size={20} className={"[&_rect_,&_path]:stroke-orange-500"} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <strong>Damage All Enemies</strong>
            <br />
            {(() => {
              const maxTarget =
                projectile.damageAllEnemiesMaxTargets === -1
                  ? "all"
                  : projectile.damageAllEnemiesMaxTargets?.toString();
              return (
                <>
                  {projectile.damageAllEnemiesRadius === DamageAllEnemiesRadius.Room && (
                    <>Projectile damages {maxTarget} enemies in the room.</>
                  )}
                  {projectile.damageAllEnemiesRadius === DamageAllEnemiesRadius.Screen && (
                    <>Projectile damages {maxTarget} enemies on the screen.</>
                  )}
                  {(projectile.damageAllEnemiesRadius || 10_001) < 10_000 && (
                    <>
                      Projectile damages {maxTarget} enemies within a radius of{" "}
                      <strong>{projectile.damageAllEnemiesRadius}</strong>.
                    </>
                  )}
                  {gun?.attribute.lifeOrb && (
                    <>
                      Projectile damages {maxTarget} enemies within a radius of <strong>100</strong>.
                    </>
                  )}
                </>
              );
            })()}
          </TooltipContent>
        </Tooltip>
      )}
      {gunStats?.projectileModule.ammoCost && gunStats?.projectileModule.ammoCost !== 1 && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div className={clsx("flex items-center", ATTRIBUTE_CLASSES)}>
              <NumericValue>{gunStats?.projectileModule.ammoCost}</NumericValue>
              <AmmoIcon size={18} className="white" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <strong>Ammo Cost</strong>
            <br />
            Consumes <strong>{gunStats?.projectileModule.ammoCost}</strong> ammo per shot.
          </TooltipContent>
        </Tooltip>
      )}
      {(projectile.explosionRadius || undefined) && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div className={clsx("flex items-center", ATTRIBUTE_CLASSES)}>
              <NumericValue className={clsx({ "text-sky-500": projectile.explosionFreezeRadius })}>
                {formatNumber(projectile.explosionRadius!, 1)}
              </NumericValue>
              <Explosion size={20} className={clsx({ "[&_path]:fill-sky-500!": projectile.explosionFreezeRadius })} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <strong>Explosive Projectile</strong>
            <br />
            Explosion radius: <strong>{formatNumber(projectile.explosionRadius!, 1)}</strong>
            {(projectile.explosionFreezeRadius || undefined) && (
              <>
                <br />
                Freeze radius: <strong>{formatNumber(projectile.explosionFreezeRadius!, 1)}</strong>
              </>
            )}
          </TooltipContent>
        </Tooltip>
      )}
      {projectile.isHoming && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div
              className={clsx("flex items-center", ATTRIBUTE_CLASSES, {
                "text-muted-foreground [&_path]:stroke-muted-foreground": homingLevel === HomingLevel.Pathetic,
                "text-white [&_path]:stroke-white": homingLevel === HomingLevel.Weak,
                "text-primary [&_path]:stroke-primary": homingLevel === HomingLevel.Strong,
                "text-orange-500 [&_path]:stroke-orange-500": homingLevel === HomingLevel.AutoAim,
                "text-red-500 [&_path]:stroke-red-500": homingLevel === HomingLevel.InstantHit,
              })}
            >
              {(projectile.homingRadius || undefined) && (
                <NumericValue>{formatNumber(projectile.homingRadius!, 0)}</NumericValue>
              )}
              {homingLevel === HomingLevel.InstantHit ? <Homing2 size={18} /> : <Homing size={18} />}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <strong>Homing Projectile</strong>
            <br />
            {(projectile.homingRadius || undefined) && (
              <>
                {homingLevel === HomingLevel.Pathetic && "Slightly curves towards enemies at close range."}
                {homingLevel === HomingLevel.Weak && "Steers toward enemies within range."}
                {homingLevel === HomingLevel.Strong && "Homings towards enemies at considerable range."}
                {homingLevel === HomingLevel.AutoAim &&
                  "Aggressively locks onto enemies from long range, sharply track the target."}
                {homingLevel === HomingLevel.InstantHit &&
                  "Hits the enemies immediately, ignoring any obstacles in the way."}
                <br />
                Target radius: <strong>{formatNumber(projectile.homingRadius!, 0)}</strong>
                <br />
                Angular velocity: <strong>{formatNumber(projectile.homingAngularVelocity!, 0)}°/s</strong>
              </>
            )}
          </TooltipContent>
        </Tooltip>
      )}
      {projectile.spawnProjectile && projectile.spawnProjectilesOnCollision && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div className={clsx("flex items-center", ATTRIBUTE_CLASSES)}>
              <NumericValue>
                {formatNumber(projectile.spawnProjectileMaxNumber || projectile.spawnProjectileNumber!, 0)}
              </NumericValue>
              <SpawnModifier size={22} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <strong>Spawn Projectile</strong>
            <br />
            Spawns{" "}
            <strong>
              {formatNumber(projectile.spawnProjectileMaxNumber || projectile.spawnProjectileNumber!, 0)}
            </strong>{" "}
            other projectiles in total upon contact.
          </TooltipContent>
        </Tooltip>
      )}
      {projectile.spawnProjectile && projectile.spawnProjectilesInflight && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div className={clsx("flex items-center", ATTRIBUTE_CLASSES)}>
              <NumericValue>{formatNumber(projectile.spawnProjectilesInflightPerSecond!, 1)}/s</NumericValue>
              <SpawnModifier size={22} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <strong>Spawn Projectile</strong>
            <br />
            Spawns a new projectile every{" "}
            <strong>{formatNumber(projectile.spawnProjectilesInflightPerSecond!, 1)}</strong> seconds while in flight.
          </TooltipContent>
        </Tooltip>
      )}
      {(projectile.penetration || undefined) && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div className={clsx("flex items-center", ATTRIBUTE_CLASSES)}>
              {(Math.floor(projectile.penetration || 0) || undefined) && (
                <NumericValue>{formatNumber(projectile.penetration!, 1)}</NumericValue>
              )}
              <Penetration size={20} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <strong>Piercing Projectile</strong>
            <br />
            Number of penetration: <strong>{formatNumber(projectile.penetration!, 1)}</strong>
          </TooltipContent>
        </Tooltip>
      )}
      {(projectile.numberOfBounces || undefined) && (
        <Tooltip delayDuration={TOOLTIP_DELAY}>
          <TooltipTrigger>
            <div className={clsx("flex items-center", ATTRIBUTE_CLASSES)}>
              {(Math.floor(projectile.numberOfBounces || 0) || undefined) && (
                <NumericValue>{formatNumber(projectile.numberOfBounces!, 1)}</NumericValue>
              )}
              <Bounce color="white" size={20} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <strong>Bouncing Projectile</strong>
            <br />
            Number of bounces: <strong>{formatNumber(projectile.numberOfBounces!, 1)}</strong>
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
