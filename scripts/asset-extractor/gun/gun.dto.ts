import z from "zod/v4";
import { AssetExternalReference, AssetExternalReferences, BinaryOption } from "../utils/schema.ts";
import { StatModifierSchema } from "../player/player.dto.ts";

export const ItemQuality = {
  EXCLUDED: -100,
  SPECIAL: -50,
  COMMON: 0,
  D: 1,
  C: 2,
  B: 3,
  A: 4,
  S: 5,
} as const;
export const GunClass = {
  NONE: 0,
  PISTOL: 1,
  SHOTGUN: 5,
  FULLAUTO: 10,
  RIFLE: 15,
  BEAM: 20,
  POISON: 25,
  FIRE: 30,
  ICE: 35,
  CHARM: 40,
  EXPLOSIVE: 45,
  SILLY: 50,
  SHITTY: 55,
  CHARGE: 60,
} as const;
export const ShootStyle = {
  SemiAutomatic: 0,
  Automatic: 1,
  Beam: 2,
  Charged: 3,
  Burst: 4,
} as const;
export const ProjectileSequenceStyle = {
  Random: 0,
  Ordered: 1,
  OrderedGroups: 2,
} as const;

export const ProjectileModule = z.object({
  shootStyle: z.enum(ShootStyle),
  /**
   * Basic array of projectiles fired per shot
   */
  projectiles: AssetExternalReferences,
  /**
   * Array of projectiles fired when the gun is charged.
   * Depends on how long the gun is charged, the projectile with the appropriate ChargeTime
   * will be selected from this array. This projectiles are used over the basic projectiles
   * if `ProjectileModule.ShootStyle` is `Charged`.
   * See `ProjectileModule.cs#GetChargeProjectile` for more details.
   */
  sequenceStyle: z.enum(ProjectileSequenceStyle),
  chargeProjectiles: z.array(
    z.object({
      ChargeTime: z.number(),
      Projectile: AssetExternalReference,
    })
  ),
  cooldownTime: z.number(),
  angleVariance: z.number(),
  numberOfShotsInClip: z.number(),
});

export const GunDto = z
  .object({
    PickupObjectId: z.number(),
    gunName: z.string(),
    quality: z.enum(ItemQuality),
    gunClass: z.enum(GunClass),
    currentGunStatModifiers: z.array(StatModifierSchema),
    passiveStatModifiers: z.array(StatModifierSchema).optional(),
    UsesBossDamageModifier: BinaryOption,
    CustomBossDamageModifier: z.number(),
    maxAmmo: z.number(),
    reloadTime: z.number(),
    blankDuringReload: BinaryOption,
    blankReloadRadius: z.number(),
    reflectDuringReload: BinaryOption,
    /**
     * A reference to a ProjectileVolleyData asset that defines complex firing behavior, e.g.:
     * - Multiple projectiles per shot (Old Goldie, Crown of Guns)
     * - Different types of projectiles fired per shot (Planet Gun)
     *
     * According to `Gun.cs#ForceFireProjectile()` and many other instances in Gun.cs, when projectile modules
     * inside volley are defined, singleModule is ignored completely.
     */
    rawVolley: AssetExternalReference,
    singleModule: ProjectileModule,
  })
  .refine(
    (data) => {
      const proj = data.singleModule.projectiles;
      const chargeProj = data.singleModule.chargeProjectiles;
      return data.rawVolley.fileID > 0 || proj.length > 0 || chargeProj.length > 0;
    },
    {
      message: "Either `rawVolley`, `singleModule.projectiles` or `singleModule.chargeProjectiles` must be non-empty.",
      path: ["singleModule"], // error will be associated with this field
    }
  );

export type TGunDto = z.input<typeof GunDto>;
export type TProjectileModule = z.input<typeof ProjectileModule>;
