import z from "zod/v4";
import { PickupObject } from "./pickup-object.model.ts";
import { Animation, CompactedFrame, RichFrame } from "./animation.model.ts";
import { Projectile } from "./projectile.model.ts";
import type { TProjectileId } from "./projectile.model.ts";

export type TShootStyle = "SemiAutomatic" | "Automatic" | "Beam" | "Charged" | "Burst";

/**
 * randomize/cycle through the projectile array for each shot
 */
export type TProjectileSequence = TProjectileId[]; // TProjectileId[]
/**
 * projectiles fired in one shot
 */
export type TProjectileModule = {
  shootStyle: TShootStyle;
  burstShotCount: number;
  burstCooldownTime: number;
  cooldownTime: number;
  spread: number;
  ammoCost?: number;
  depleteAmmo?: boolean;
  projectiles: TProjectileSequence;
  finalProjectile?: TProjectileId;
  finalProjectileCount?: number;
};
export const ProjectileModule = z.object({
  shootStyle: z.enum(["SemiAutomatic", "Automatic", "Beam", "Charged", "Burst"]),
  burstShotCount: z.number().nonnegative(),
  burstCooldownTime: z.number().nonnegative(),
  cooldownTime: z.number(),
  spread: z.number(),
  /**
   * Cost of ammo, set to `undefined` if it is `1`
   *
   * Note: This does not affect the magazine size but rather the number of ammo left from the total ammo pool.
   */
  ammoCost: z.number().min(2).optional(),
  /**
   * If any module in a volley has `depleteAmmo` set to true, a single shot will consume the entire magazine.
   */
  depleteAmmo: z.boolean().optional(),
  projectiles: z.array(Projectile.shape.id),
  finalProjectile: Projectile.shape.id.optional(),
  finalProjectileCount: z.number().optional(),
}) satisfies z.ZodType<TProjectileModule>;

export interface TProjectileMode {
  mode: string;
  chargeTime?: number;
  magazineSize: number;
  volley: TProjectileModule[];
}

export const ProjectileMode = z.object({
  mode: z.string(),
  chargeTime: z.number().optional(),
  magazineSize: z.number(),
  volley: z.array(ProjectileModule),
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
      "hasStatusEffects",
      "hasTieredProjectiles",
      "hasFinalProjectile",
      "hasHomingProjectiles",
      "hasSpawningProjectiles",
      "hasExplosiveProjectile",
      "hasProjectilePool",
      "hasSpecialAbilities",
      "hasSpecialProjectiles",
      "hasMultipleDamageSources",
      "hasStatModifiers",
      "hasGoop",
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

    auraOnReload: z.boolean().optional(),
    auraOnReloadRadius: z.number().optional(),
    auraOnReloadDps: z.number().optional(),
    auraOnReloadIgniteDps: z.number().optional(),

    spawnChestOnDepletion: z.boolean().optional(),
    inputCombo: z.boolean().optional(),
    lifeOrb: z.boolean().optional(),

    /**
     * Gun that switch between 2 firing modes after a reload
     */
    trickGun: z.boolean().optional(),
  }),
  video: z.string().optional(),
  /**
   * List of dominant colors of the sprite. The first color is the most dominant (primary), followed by secondary, tertiary, etc.
   */
  colors: z.array(z.string()),
  animation: z.object({
    idle: Animation,
    lifeOrbFullIdle: Animation.optional(),
    reload: Animation.optional(),
    intro: Animation.optional(),
    alternateIdle: Animation.optional(),
    alternateReload: Animation.optional(),
    charge: Animation.optional(),
  }),
});

const createDerivedGunSchema = <T extends z.ZodTypeAny>(frameSchema: T) => {
  const AnimationSchema = Animation.extend({ frames: z.array(frameSchema) });

  return Gun.extend({
    animation: z.object({
      idle: AnimationSchema,
      lifeOrbFullIdle: AnimationSchema.optional(),
      reload: AnimationSchema.optional(),
      intro: AnimationSchema.optional(),
      alternateIdle: AnimationSchema.optional(),
      alternateReload: AnimationSchema.optional(),
      charge: AnimationSchema.optional(),
    }),
  });
};

export const GunForStorage = createDerivedGunSchema(CompactedFrame);
export const GunFromStorage = createDerivedGunSchema(RichFrame);

export type TGun = z.input<typeof Gun>;
