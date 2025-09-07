import z from "zod/v4";
import { AssetExternalReference, AssetExternalReferences, BinaryOption } from "../utils/schema.ts";
import { StatModifierSchema } from "../player/player.dto.ts";
import { EncounterTrackable, SpriteAnimatorData, SpriteData } from "../asset/component.dto.ts";
import { GameActorHealthEffect } from "./projectile.dto.ts";

export const VFXPoolType = {
  None: 0,
  All: 1,
  SequentialGroups: 2,
  RandomGroups: 3,
  Single: 4,
} as const;

export const VfxPool = z.object({
  type: z.enum(VFXPoolType),
  effects: z.array(
    z.object({
      effects: z.array(
        z.object({
          effect: AssetExternalReference,
        }),
      ),
    }),
  ),
});

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

// ExportedProject/Assets/Scripts/Assembly-CSharp/ProjectileModule.cs
export const ChargeProjectileProperties = {
  ammo: 0x1,
  depleteAmmo: 0x40,
  reflectBullets: 0x200,
} as const;

export const ProjectileModuleDto = z.object({
  shootStyle: z.enum(ShootStyle),
  /**
   * Basic array of projectiles fired per shot
   */
  projectiles: AssetExternalReferences,
  sequenceStyle: z.enum(ProjectileSequenceStyle),
  /**
   * Array of projectiles fired when the gun is charged.
   * Depends on how long the gun is charged, the projectile with the appropriate ChargeTime
   * will be selected from this array. This projectiles are used over the basic projectiles
   * if `ProjectileModule.ShootStyle` is `Charged`.
   * See `ProjectileModule.cs#GetChargeProjectile` for more details.
   */
  chargeProjectiles: z.array(
    z.object({
      ChargeTime: z.number(),
      Projectile: AssetExternalReference,
      UsedProperties: z.number(),
      /**
       * Override `ProjectileModule.ammoCost` if exists.
       */
      AmmoCost: z.number(),
    }),
  ),
  /**
   * Spawn 1 additional projectile per shot. See [https://enterthegungeon.fandom.com/wiki/Gilded_Hydra](https://enterthegungeon.fandom.com/wiki/Gilded_Hydra) for example.
   */
  mirror: BinaryOption,
  ammoCost: z.number(),
  burstShotCount: z.number().nonnegative(),
  burstCooldownTime: z.number().nonnegative(),
  cooldownTime: z.number(),
  angleVariance: z.number(),
  /**
   * Could be negative, if so, the gun magazine = maxAmmo
   */
  numberOfShotsInClip: z.number(),
});

const GunData = z
  .object({
    PickupObjectId: z.number(),
    quality: z.enum(ItemQuality),
    gunClass: z.enum(GunClass),
    currentGunStatModifiers: z.array(StatModifierSchema),
    passiveStatModifiers: z.array(StatModifierSchema).optional(),
    UsesBossDamageModifier: BinaryOption,
    /**
     * Note: this is a separate modifier that is applied on top of `StatModifier.DamageToBosses`.
     */
    CustomBossDamageModifier: z.number(),
    maxAmmo: z.number(),
    reloadTime: z.number(),
    blankDuringReload: BinaryOption,
    blankReloadRadius: z.number(),
    reflectDuringReload: BinaryOption,
    /**
     * A reference to a ProjectileVolleyData asset that defines complex firing behavior, e.g.:
     * - Multiple projectiles per shot (Old Goldie, Crown of Guns)
     *
     * According to `Gun.cs#ForceFireProjectile()` and many other instances in Gun.cs, when projectile modules
     * inside volley are defined, singleModule is ignored completely.
     */
    rawVolley: AssetExternalReference,
    singleModule: ProjectileModuleDto,
    activeReloadData: z.object({
      reloadSpeedMultiplier: z.number(),
    }),
    reloadAnimation: z.string().nullable(),
    idleAnimation: z.string().nullable(),
    shootAnimation: z.string().nullable(),
    chargeAnimation: z.string().nullable(),
    emptyAnimation: z.string().nullable(),
    introAnimation: z.string().nullable(),
    IsTrickGun: BinaryOption,
    alternateVolley: AssetExternalReference,
    alternateIdleAnimation: z.string().nullable(),
    /**
     * Gungeon Ant flip the ant when running reload animation but doesn't have `alternateIdleAnimation`
     */
    alternateReloadAnimation: z.string().nullable(),
    LocalActiveReload: BinaryOption,
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
    },
  );

const TrackInputDirectionalPadData = z.object({
  HadoukenProjectile: AssetExternalReference.required(),
  grappleModule: z.object({
    GrapplePrefab: AssetExternalReference.required(),
    GrappleSpeed: z.number(),
    DamageToEnemies: z.number(),
    EnemyKnockbackForce: z.number(),
  }),
});

const SpawnItemOnGunDepletionData = z.object({
  IsSynergyContingent: BinaryOption,
  SynergyToCheck: z.number(),
  // TODO: handle trash gun
  UsesSpecificItem: BinaryOption,
  SpecificItemId: z.number(),
});

const PredatorGunControllerData = z.object({
  HomingRadius: z.number(),
  HomingAngularVelocity: z.number(),
});

const GunExtraSettingSynergyProcessorData = z.object({
  ReflectedBulletDamageModifier: z.number(),
});

const AuraOnReloadModifierData = z.object({
  AuraRadius: z.number(),
  DamagePerSecond: z.number(),
  IgnitesEnemies: BinaryOption,
  IgniteEffect: GameActorHealthEffect,
});

export const GunDto = z.object({
  name: z.string(),
  gun: GunData,
  sprite: SpriteData,
  spriteVfx: SpriteData.optional(),
  spriteAnimator: SpriteAnimatorData,
  trackInputDirectionalPad: TrackInputDirectionalPadData.optional(),
  spawnItemOnGunDepletion: SpawnItemOnGunDepletionData.optional(),
  predatorGunController: PredatorGunControllerData.optional(),
  gunExtraSettingSynergyProcessor: GunExtraSettingSynergyProcessorData.optional(),
  auraOnReloadModifier: AuraOnReloadModifierData.optional(),
  encounterTrackable: EncounterTrackable.optional(),
});

export type TGunDto = z.input<typeof GunDto>;
export type TGunData = z.input<typeof GunData>;
export type TTrackInputDirectionalPadData = z.input<typeof TrackInputDirectionalPadData>;
export type TSpawnItemOnGunDepletionData = z.input<typeof SpawnItemOnGunDepletionData>;
export type TPredatorGunControllerData = z.input<typeof PredatorGunControllerData>;
export type TGunExtraSettingSynergyProcessorData = z.input<typeof GunExtraSettingSynergyProcessorData>;
export type TAuraOnReloadModifierData = z.input<typeof AuraOnReloadModifierData>;
export type TProjectileModuleDto = z.input<typeof ProjectileModuleDto>;
