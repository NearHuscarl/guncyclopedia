import z from "zod/v4";

const PickupObject = z.object({
  id: z.number(),
  name: z.string(),
  quote: z.string(),
  description: z.string(),
  type: z.enum(["gun", "item"]),
});

const Projectile = z.object({
  damage: z.number(),
  speed: z.number(),
  range: z.number(),
  force: z.number(),
  // TODO: research ProjectileModule.cs#GetEstimatedShotsPerSecond
  // dps: z.undefined(),
});

export const ProjectileMode = z.object({
  name: z.string(),
  shootStyle: z.enum(["SemiAutomatic", "Automatic", "Beam", "Charged", "Burst"]),
  chargeTime: z.number().optional(),
  cooldownTime: z.number(),
  magazineSize: z.number(),
  spread: z.number(),
  projectiles: z.array(Projectile),
});

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
  projectileModes: z.array(ProjectileMode),
  maxAmmo: z.number(),
  reloadTime: z.number(),
  featureFlags: z.array(z.enum(["hasInfiniteAmmo", "doesntDamageSecretWalls"])),
  video: z.string().optional(),
});

export const Item = PickupObject.extend({
  type: z.literal("item"),
  isPassive: z.boolean(),
});

export type TPickupObject = z.input<typeof PickupObject>;

export type TItem = z.input<typeof Item>;

export type TProjectile = z.input<typeof Projectile>;
export type TProjectileMode = z.input<typeof ProjectileMode>;
export type TGun = z.input<typeof Gun>;
