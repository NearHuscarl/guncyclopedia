import z from "zod/v4";
import { Percentage, Position } from "./schema.ts";
import { PickupObject } from "./pickup-object.model.ts";

const Projectile = z.object({
  /**
   * basename of the meta file that associates with the prefab file
   */
  id: z.string(),
  ignoreDamageCaps: z.boolean().optional(),
  damage: z.number(),
  speed: z.number(),
  range: z.number(),
  force: z.number(),

  /**
   * Chance to spawn this projectile = `spawnWeight / projectileModes.length`.
   */
  spawnWeight: z.number().optional(),

  poisonChance: Percentage.optional(),
  speedChance: Percentage.optional(),
  charmChance: Percentage.optional(),
  freezeChance: Percentage.optional(),
  fireChance: Percentage.optional(),
  stunChance: Percentage.optional(),
  cheeseChance: Percentage.optional(),

  numberOfBounces: z.number().optional(),
  /**
   * Chance to die on bounce. Default is `0`.
   */
  chanceToDieOnBounce: Percentage.optional(),

  /**
   * The number of times the projectile can pierce through enemies or objects.
   */
  penetration: z.number().optional(),
  canPenetrateObjects: z.boolean().optional(),

  isHoming: z.boolean().optional(),
  homingAnddamageAllEnemies: z.boolean().optional(),
  homingRadius: z.number().optional(),
  homingAngularVelocity: z.number().optional(),

  beamChargeTime: z.number().optional(),
  /**
   * Chance to apply a status effect per second.
   *
   * If a beam weapon has status effects, the default is `1`
   *
   * For [Science Cannon](https://enterthegungeon.fandom.com/wiki/Science_Cannon), multiple effects can be applied at the same time.
   */
  beamStatusEffectChancePerSecond: Percentage.optional(),
  // TODO: research ProjectileModule.cs#GetEstimatedShotsPerSecond
  // dps: z.undefined(),
});

/**
 * randomize/cycle through the projectile array for each shot
 */
export type TProjectileSequence = TProjectile[]; // TProjectile[]
/**
 * projectiles fired in one shot
 */
export type TProjectilePerShot = {
  shootStyle: "SemiAutomatic" | "Automatic" | "Beam" | "Charged" | "Burst";
  cooldownTime: number;
  spread: number;
  projectiles: TProjectileSequence;
};
export const ProjectilePerShot = z.object({
  shootStyle: z.enum(["SemiAutomatic", "Automatic", "Beam", "Charged", "Burst"]),
  cooldownTime: z.number(),
  spread: z.number(),
  projectiles: z.array(Projectile),
}) satisfies z.ZodType<TProjectilePerShot>;

export interface TProjectileMode {
  mode: string;
  chargeTime?: number;
  magazineSize: number;
  projectiles: TProjectilePerShot[];
}

export const ProjectileMode = z.object({
  mode: z.string(),
  chargeTime: z.number().optional(),
  magazineSize: z.number(),
  projectiles: z.array(ProjectilePerShot),
}) satisfies z.ZodType<TProjectileMode>;

export const Gun = PickupObject.extend({
  type: z.literal("gun"),
  gunNameInternal: z.string(),
  quality: z.enum(["EXCLUDED", "SPECIAL", "COMMON", "D", "C", "B", "A", "S"]),
  gunClass: z.enum([
    "NONE",
    "PISTOL",
    "SHOTGUN",
    "FULLAUTO",
    "RIFLE",
    "BEAM",
    "POISON",
    "FIRE",
    "ICE",
    "CHARM",
    "EXPLOSIVE",
    "SILLY",
    "SHITTY",
    "CHARGE",
  ]),
  playerStatModifiers: z.array(
    z.object({
      statToBoost: z.enum([
        "MovementSpeed",
        "RateOfFire",
        "Accuracy",
        "Health",
        "Coolness",
        "Damage",
        "ProjectileSpeed",
        "AdditionalGunCapacity",
        "AdditionalItemCapacity",
        "AmmoCapacityMultiplier",
        "ReloadSpeed",
        "AdditionalShotPiercing",
        "KnockbackMultiplier",
        "GlobalPriceMultiplier",
        "Curse",
        "PlayerBulletScale",
        "AdditionalClipCapacityMultiplier",
        "AdditionalShotBounces",
        "AdditionalBlanksPerFloor",
        "ShadowBulletChance",
        "ThrownGunDamage",
        "DodgeRollDamage",
        "DamageToBosses",
        "EnemyProjectileSpeedMultiplier",
        "ExtremeShadowBulletChance",
        "ChargeAmountMultiplier",
        "RangeMultiplier",
        "DodgeRollDistanceMultiplier",
        "DodgeRollSpeedMultiplier",
        "TarnisherClipCapacityMultiplier",
        "MoneyMultiplierFromEnemies",
      ]),
      modifyType: z.enum(["ADDITIVE", "MULTIPLICATIVE"]),
      amount: z.number(),
    }),
  ),
  projectileModes: z.array(ProjectileMode).nonempty(),
  maxAmmo: z.number(),
  reloadTime: z.number(),
  featureFlags: z.array(
    z.enum([
      "hasInfiniteAmmo",
      "doesntDamageSecretWalls",
      "reflectDuringReload",
      "blankDuringReload",
      "activeReload",
      "hasStatusEffects",
      "hasTieredProjectiles",
      "hasHomingProjectiles",
      "hasProjectilePool",
    ]),
  ),
  blankReloadRadius: z.number().optional(),
  video: z.string().optional(),
  animation: z.object({
    name: z.string(),
    fps: z.number(),
    loopStart: z.number(),
    /**
     * Wrap mode for the animation.
     * - Loop: The animation loops indefinitely, starting from `0`, NOT `loopStart`.
     * - LoopFidget: The animation loops indefinitely, but wait for a random duration between `minFidgetDuration` and `maxFidgetDuration` before starting again.
     * - LoopSection: Play the 'intro' frames [0 ... loopStart-1] once, then loop only the section [loopStart ... last] forever.
     */
    wrapMode: z.enum(["Loop", "LoopSection", "Once", "PingPong", "RandomFrame", "RandomLoop", "Single", "LoopFidget"]),
    minFidgetDuration: z.number(),
    maxFidgetDuration: z.number(),
    texturePath: z.string(),
    frames: z.array(
      z.object({
        spriteName: z.string(),
        spriteId: z.number().min(-1),
        flipped: z.boolean(),
        uvs: z.tuple([Position, Position, Position, Position]),
      }),
    ),
  }),
});

export type TProjectile = z.input<typeof Projectile>;
export type TGun = z.input<typeof Gun>;
