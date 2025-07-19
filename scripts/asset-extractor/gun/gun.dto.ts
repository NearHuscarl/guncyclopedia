import z from "zod/v4";
import { AssetExternalReference } from "../utils/schema.ts";

export const ItemQuality = {
  EXCLUDED: -100,
  SPECIAL: -50,
  COMMON: 0,
  D: 1,
  C: 2,
  B: 3,
  A: 4,
  S: 5,
};
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
};
export const ShootStyle = {
  SemiAutomatic: 0,
  Automatic: 1,
  Beam: 2,
  Charged: 3,
  Burst: 4,
};

export const GunDto = z
  .object({
    PickupObjectId: z.number(),
    gunName: z.string(),
    quality: z.enum(ItemQuality),
    gunClass: z.enum(GunClass),
    maxAmmo: z.number(),
    reloadTime: z.number(),
    singleModule: z.object({
      shootStyle: z.enum(ShootStyle),
      /* Basic array of projectiles fired per shot */
      projectiles: z.array(AssetExternalReference),
      chargeProjectiles: z.array(
        z.object({
          ChargeTime: z.number(),
          Projectile: AssetExternalReference,
        })
      ),
      cooldownTime: z.number(),
      angleVariance: z.number(),
      numberOfShotsInClip: z.number(),
    }),
  })
  .refine(
    (data) => {
      const proj = data.singleModule.projectiles.filter((p) => p.fileID !== 0);
      const chargeProj = data.singleModule.chargeProjectiles;
      return proj.length > 0 || chargeProj.length > 0;
    },
    {
      message: "Either `projectiles` or `chargeProjectiles` must be non-empty.",
      path: ["singleModule"], // error will be associated with this field
    }
  );

export type TGunDto = z.input<typeof GunDto>;
