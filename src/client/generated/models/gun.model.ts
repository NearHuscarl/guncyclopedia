import z from "zod/v4";
import { PickupObject } from "./pickup-object.model.ts";
import { Animation } from "./animation.model.ts";
import { Percentage } from "./schema.ts";

export type TStatusEffectProp =
  | "poisonChance"
  | "speedChance"
  | "charmChance"
  | "freezeChance"
  | "fireChance"
  | "stunChance"
  | "cheeseChance";

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
   * Extra damage from explosion, ricochet, or custom projectile like blackhole
   */
  additionalDamage: z.array(
    z.object({
      type: z.enum(["dps", "instant"]).optional().default("instant"),
      /**
       * If `isEstimated` is true, the damage is an estimate based on the best outcome.
       *
       * E.g. for ricochets, the damage is computed as if all bounces hit an enemy.
       */
      isEstimated: z.boolean().optional(),
      /**
       * If `canNotStack` is true, all damages with the same source can only be applied once.
       */
      canNotStack: z.boolean().optional(),
      source: z.enum(["ricochet", "blackhole", "fire", "poison"]),
      damage: z.number(),
    }),
  ),

  /**
   * Chance to spawn this projectile = `spawnWeight / projectileModes.length`.
   */
  spawnWeight: z.number().optional(),

  poisonChance: Percentage.optional(),
  poisonDuration: z.number().optional(),

  speedChance: Percentage.optional(),
  speedDuration: z.number().optional(),
  speedMultiplier: z.number().optional(),

  charmChance: Percentage.optional(),
  charmDuration: z.number().optional(),

  freezeChance: Percentage.optional(),
  freezeDuration: z.number().optional(),
  freezeAmount: z.number().optional(),

  fireChance: Percentage.optional(),
  fireDuration: z.number().optional(),

  stunChance: Percentage.optional(),
  stunDuration: z.number().optional(),

  cheeseChance: Percentage.optional(),
  cheeseDuration: z.number().optional(),
  cheeseAmount: z.number().optional(),

  numberOfBounces: z.number().optional(),
  /**
   * Chance to die on bounce. Default is `0`.
   */
  chanceToDieOnBounce: Percentage.optional(),
  damageMultiplierOnBounce: z.number().nonnegative().optional(),

  /**
   * The number of times the projectile can pierce through enemies or objects.
   */
  penetration: z.number().optional(),
  canPenetrateObjects: z.boolean().optional(),
  /**
   * Instantly damage all enemies in the room/viewport
   */
  damageAllEnemies: z.boolean().optional(),

  isHoming: z.boolean().optional(),
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

  /**
   * Some projectiles are invisible hence no animation.
   */
  animation: Animation.optional(),
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
  burstShotCount: number;
  burstCooldownTime: number;
  cooldownTime: number;
  spread: number;
  projectiles: TProjectileSequence;
};
export const ProjectilePerShot = z.object({
  shootStyle: z.enum(["SemiAutomatic", "Automatic", "Beam", "Charged", "Burst"]),
  burstShotCount: z.number().nonnegative(),
  burstCooldownTime: z.number().nonnegative(),
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
      "activeReload",
      "hasStatusEffects",
      "hasTieredProjectiles",
      "hasHomingProjectiles",
      "hasProjectilePool",
      "damageAllEnemies",
    ]),
  ),
  attribute: z.object({
    reflectDuringReload: z.boolean().optional(),
    reflectDuringReloadDmgModifier: z.number().optional(),
    blankDuringReload: z.boolean().optional(),
    /**
     * Used when `reflectDuringReload` or `blankDuringReload` is true
     */
    blankReloadRadius: z.number().optional(),

    /**
     * https://enterthegungeon.fandom.com/wiki/Rad_Gun
     */
    activeReload: z.boolean().optional(),
  }),
  video: z.string().optional(),
  /**
   * List of dominant colors of the sprite. The first color is the most dominant (primary), followed by secondary, tertiary, etc.
   */
  colors: z.array(z.string()),
  animation: Animation,
});

export type TProjectile = z.input<typeof Projectile>;
export type TGun = z.input<typeof Gun>;
