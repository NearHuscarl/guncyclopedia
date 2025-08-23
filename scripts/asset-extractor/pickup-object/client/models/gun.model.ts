import z from "zod/v4";
import { PickupObject } from "./pickup-object.model.ts";
import { Animation, CompactedFrame, RichFrame } from "./animation.model.ts";
import { Projectile } from "./projectile.model.ts";
import type { TProjectile } from "./projectile.model.ts";

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
      "hasStatusEffects",
      "hasTieredProjectiles",
      "hasHomingProjectiles",
      "hasExplosiveProjectile",
      "hasProjectilePool",
      "hasSpecialAbilities",
      "hasStatModifiers",
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
    reload: Animation.optional(),
    alternateIdle: Animation.optional(),
    alternateReload: Animation.optional(),
    charge: Animation.optional(),
  }),
});

const createDerivedGunSchema = <T extends z.ZodTypeAny>(frameSchema: T) => {
  const AnimationSchema = Animation.extend({ frames: z.array(frameSchema) });
  const ProjectileSchema = Projectile.extend({
    animation: AnimationSchema.optional(),
  });
  const ProjectilePerShotSchema = ProjectilePerShot.extend({
    projectiles: z.array(ProjectileSchema),
  });
  const ProjectileModeSchema = ProjectileMode.extend({
    projectiles: z.array(ProjectilePerShotSchema),
  });

  return Gun.extend({
    projectileModes: z.array(ProjectileModeSchema).nonempty(),
    animation: z.object({
      idle: AnimationSchema,
      reload: AnimationSchema.optional(),
      alternateIdle: AnimationSchema.optional(),
      alternateReload: AnimationSchema.optional(),
      charge: AnimationSchema.optional(),
    }),
  });
};

export const GunForStorage = createDerivedGunSchema(CompactedFrame);
export const GunFromStorage = createDerivedGunSchema(RichFrame);

export type TGun = z.input<typeof Gun>;
