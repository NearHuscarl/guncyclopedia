import z from "zod/v4";
import { AssetExternalReference, BinaryOption, Percentage } from "../utils/schema.ts";
import { MonoBehaviour } from "../asset/asset.dto.ts";
import { SpriteAnimatorData, SpriteData } from "../asset/component.dto.ts";

const CoreDamageType = {
  None: 0,
  Void: 1,
  Magic: 2,
  Fire: 4,
  Ice: 8,
  Poison: 0x10,
  Water: 0x20,
  Electric: 0x40,
  SpecialBossDamage: 0x80,
};

const GameActorEffect = z.object({
  /**
   * For all status effects, assuming `stackMode = EffectStackingMode.Refresh`
   *
   * E.g. the effect duration is reset whenever the effect is reapplied
   */
  duration: z.number(),
});
const GameActorSpeedEffect = GameActorEffect.extend({
  SpeedMultiplier: z.number(),
});
export const GameActorHealthEffect = GameActorEffect.extend({
  DamagePerSecondToEnemies: z.number(),
});
const GameActorFreezeEffect = GameActorEffect.extend({
  FreezeAmount: z.number(),
});
const GameActorCheeseEffect = GameActorEffect.extend({
  CheeseAmount: z.number(),
});

const BounceProjModifierData = z.object({
  numberOfBounces: z.number(),
  chanceToDieOnBounce: z.number(),
  damageMultiplierOnBounce: z.number(),
});

const PierceProjModifierData = z.object({
  penetration: z.number(),
  penetratesBreakables: BinaryOption,
});

const ExplosiveModifierData = z.object({
  /**
   * normally true, if false then explosion doesn't deal any damage and only has distortion wave effect (Particulator)
   */
  doExplosion: BinaryOption,
  explosionData: z.object({
    damageRadius: z.number(),
    /**
     * Ice_Giant_Gun_Projectile creates a freezing explosion without dealing any damage
     */
    doDamage: BinaryOption,
    damage: z.number(),
    doForce: BinaryOption,
    /**
     * Stacked with base force.
     */
    force: z.number(),
    isFreezeExplosion: BinaryOption,
    freezeRadius: z.number(),
    freezeEffect: GameActorFreezeEffect,
  }),
});

const HomingModifierData = z.object({
  HomingRadius: z.number(),
  AngularVelocity: z.number(),
});

const SpawnProjModifierData = z.object({
  spawnProjectilesInFlight: BinaryOption,
  projectileToSpawnInFlight: AssetExternalReference,
  inFlightSpawnCooldown: z.number(), // in seconds
  numToSpawnInFlight: z.number(),

  spawnProjectilesOnCollision: BinaryOption,
  numberToSpawnOnCollison: z.number(), // typo from the game source code, not mine ChatGPT!
  spawnCollisionProjectilesOnBounce: BinaryOption,
  projectileToSpawnOnCollision: AssetExternalReference,

  /**
   * Very useless property since the one projectile that uses this feature only spawns
   * a single type of projectile on collision. Data will be normalized.
   */
  UsesMultipleCollisionSpawnProjectiles: BinaryOption,
  collisionSpawnProjectiles: z.array(AssetExternalReference),
});

const GoopDefinitionData = z.object({
  CanBeIgnited: BinaryOption,
  fireDamagePerSecondToEnemies: z.number(),
});

const GoopModifierData = z.object({
  SpawnGoopInFlight: BinaryOption,
  SpawnGoopOnCollision: BinaryOption,
  CollisionSpawnRadius: z.number(),
  goopDefinition: AssetExternalReference.required(),
  goopDefinitionData: GoopDefinitionData.optional(),
  /**
   * Does this modifier require a specific synergy to function?
   */
  IsSynergyContingent: BinaryOption,
});

/**
 * Bullets close to each other will link together, hurting enemies that touch the link.
 */
const ChainLightningModifierData = z.object({
  maximumLinkDistance: z.number(),
  damagePerHit: z.number(),
});

/**
 * Restores ammo to the gun when hitting an enemy with the projectile.
 */
const RestoreAmmoToGunModifierData = z.object({
  ChanceToWork: z.number(),
  AmmoToGain: z.number(),
  RequiresSynergy: BinaryOption,
  RequiredSynergy: z.number(),
});

const ModifyProjectileSynergyProcessorData = z.object({
  /**
   * Note: This belongs to a synergy that is ALWAYS inactive.
   * But the synergy gives an exception to `Dejams` property as long as it's set to true
   */
  Dejams: BinaryOption,
  Blanks: BinaryOption,
});

const BasicBeamControllerData = z.object({
  usesChargeDelay: BinaryOption,
  chargeDelay: z.number(),
  statusEffectChance: z.number(),
  homingRadius: z.number(),
  homingAngularVelocity: z.number(),
});
const RaidenBeamControllerData = z.object({
  maxTargets: z.number(),
  targetType: z.union([z.literal(10), z.literal(20)]),
});
const ReverseBeamControllerData = z.object({
  targetType: z.union([z.literal(10), z.literal(20)]),
});

const BlackHoleDoerData = z.object({
  damageRadius: z.number(),
  damageToEnemiesPerSecond: z.number(),
});

const MindControlProjectileModifierData = MonoBehaviour.extend({});

const MatterAntimatterProjectileModifierData = MonoBehaviour.extend({
  isAntimatter: BinaryOption,
  antimatterExplosion: ExplosiveModifierData.shape.explosionData,
});

const StickyGrenadeBuffData = MonoBehaviour.extend({
  IsSynergyContingent: BinaryOption,
  RequiredSynergy: z.number(),
  explosionData: ExplosiveModifierData.shape.explosionData,
});

const HealthModificationBuffData = MonoBehaviour.extend({
  lifetime: z.number(),
  tickPeriod: z.number(),
  /**
   * `n` is the number of ticks in a lifetime: `lifetime / tickPeriod`
   *
   * health delta changes after every tick from `healthChangeAtStart + 1/n * (healthChangeAtEnd - healthChangeAtStart)` to `healthChangeAtEnd` during the lifetime
   * of this component.
   *
   * But since all instances of this component have the same start & end. The damage dealt is simply a constant.
   */
  healthChangeAtStart: z.number(),
  healthChangeAtEnd: z.number(),
});

const ThreeWishesBuffData = MonoBehaviour.extend({
  SynergyContingent: BinaryOption,
  RequiredSynergy: z.number(),
  /**
   * Number of hits required to trigger the effect
   */
  NumRequired: z.number(),
  DamageDealt: z.number(),
});

const DevolverModifierData = MonoBehaviour.extend({
  chanceToDevolve: z.number(),
  /**
   * `DevolverHierarchy` is an underused feature that allows for more complex projectile behaviors.
   * When a projectile hits the enemy, it has a chance to devolve into a weaker tier.
   *
   * Variants in the same tier are defined in `DevolverHierarchy[number].tierGuids`.
   *
   * Right now, there is only a single enemy in 1 tier to devolve to so this feature is not exactly useful.
   */
  DevolverHierarchy: z
    .array(
      z.object({
        tierGuids: z.array(z.string()).max(1),
      }),
    )
    .max(1),
});

const ProjectileData = MonoBehaviour.extend({
  ignoreDamageCaps: BinaryOption,
  baseData: z.object({
    damage: z.number(),
    speed: z.number(),
    range: z.number(),
    force: z.number(),
  }),
  damageTypes: z.enum(CoreDamageType),
  damagesWalls: BinaryOption,

  AppliesPoison: BinaryOption,
  PoisonApplyChance: Percentage,
  healthEffect: GameActorHealthEffect,

  AppliesSpeedModifier: BinaryOption,
  SpeedApplyChance: z.number(), // not Percentage because of a malformed projectile
  speedEffect: GameActorSpeedEffect,

  AppliesCharm: BinaryOption,
  CharmApplyChance: Percentage,
  charmEffect: GameActorEffect,

  AppliesFreeze: BinaryOption,
  FreezeApplyChance: Percentage,
  freezeEffect: GameActorFreezeEffect,

  AppliesFire: BinaryOption,
  FireApplyChance: Percentage,
  fireEffect: GameActorHealthEffect,

  AppliesStun: BinaryOption,
  StunApplyChance: Percentage,
  AppliedStunDuration: z.number(),

  AppliesCheese: BinaryOption,
  CheeseApplyChance: Percentage,
  cheeseEffect: GameActorCheeseEffect,

  CanTransmogrify: BinaryOption,
  ChanceToTransmogrify: z.number(),
  TransmogrifyTargetGuids: z.array(z.string()).min(0).max(1),

  /**
   * `BoomerangProjectile` subclass
   */
  StunDuration: z.number().optional(),
  // TODO: what the heck is bleed effect?
});

/**
 * Used to normalize the special grappling hook projectile
 */
export const GrapplingHookProjectileData = ProjectileData.extend({
  $$component: z.string().default(""),
  $$fileID: z.string().default(""),
  m_Script: ProjectileData.shape.m_Script.nonoptional().default({ $$scriptPath: "", fileID: 0, guid: "", type: 0 }),
  ignoreDamageCaps: ProjectileData.shape.ignoreDamageCaps.default(0),
  baseData: ProjectileData.shape.baseData.nonoptional().default({ damage: 0, speed: 0, range: 0, force: 0 }),
  damageTypes: ProjectileData.shape.damageTypes.default(CoreDamageType.None),
  damagesWalls: ProjectileData.shape.damagesWalls.default(0),

  AppliesPoison: ProjectileData.shape.AppliesPoison.default(0),
  PoisonApplyChance: ProjectileData.shape.PoisonApplyChance.default(0),
  healthEffect: ProjectileData.shape.healthEffect.default({ DamagePerSecondToEnemies: 0, duration: 0 }),

  AppliesSpeedModifier: ProjectileData.shape.AppliesSpeedModifier.default(0),
  SpeedApplyChance: ProjectileData.shape.SpeedApplyChance.default(0),
  speedEffect: ProjectileData.shape.speedEffect.default({ SpeedMultiplier: 0, duration: 0 }),

  AppliesCharm: ProjectileData.shape.AppliesCharm.default(0),
  CharmApplyChance: ProjectileData.shape.CharmApplyChance.default(0),
  charmEffect: ProjectileData.shape.charmEffect.default({ duration: 0 }),

  AppliesFreeze: ProjectileData.shape.AppliesFreeze.default(0),
  FreezeApplyChance: ProjectileData.shape.FreezeApplyChance.default(0),
  freezeEffect: ProjectileData.shape.freezeEffect.default({ duration: 0, FreezeAmount: 0 }),

  AppliesFire: ProjectileData.shape.AppliesFire.default(0),
  FireApplyChance: ProjectileData.shape.FireApplyChance.default(0),
  fireEffect: ProjectileData.shape.fireEffect.default({ DamagePerSecondToEnemies: 0, duration: 0 }),

  AppliesStun: ProjectileData.shape.AppliesStun.default(0),
  StunApplyChance: ProjectileData.shape.StunApplyChance.default(0),
  AppliedStunDuration: ProjectileData.shape.AppliedStunDuration.default(0),

  AppliesCheese: ProjectileData.shape.AppliesCheese.default(0),
  CheeseApplyChance: ProjectileData.shape.CheeseApplyChance.default(0),
  cheeseEffect: ProjectileData.shape.cheeseEffect.default({ duration: 0, CheeseAmount: 0 }),

  CanTransmogrify: ProjectileData.shape.CanTransmogrify.default(0),
  ChanceToTransmogrify: ProjectileData.shape.ChanceToTransmogrify.default(0),
  TransmogrifyTargetGuids: ProjectileData.shape.TransmogrifyTargetGuids.default([]),

  StunDuration: ProjectileData.shape.StunDuration.default(0),
});

const CerebralBoreProjectileData = ProjectileData.extend({
  explosionData: ExplosiveModifierData.shape.explosionData,
});

const HelixProjectileData = ProjectileData.extend({
  helixWavelength: z.number(),
  helixAmplitude: z.number(),
});

const BoomerangProjectileData = ProjectileData.extend({
  trackingSpeed: z.number(),
});

const BeeProjectileData = ProjectileData.extend({
  angularAcceleration: z.number(),
});

const RobotechProjectileData = ProjectileData.extend({
  angularAcceleration: z.number(),
});

export const ProjectileDto = z.object({
  id: z.string(),
  projectile: z.union([
    BoomerangProjectileData,
    BeeProjectileData,
    RobotechProjectileData,
    CerebralBoreProjectileData,
    HelixProjectileData,
    ProjectileData,
    GrapplingHookProjectileData,
  ]),
  sprite: SpriteData.optional(),
  spriteAnimator: SpriteAnimatorData.optional(),
  bounceProjModifier: BounceProjModifierData.optional(),
  pierceProjModifier: PierceProjModifierData.optional(),
  explosiveModifier: ExplosiveModifierData.optional(),
  homingModifier: HomingModifierData.optional(),
  spawnProjModifier: SpawnProjModifierData.optional(),
  goopModifier: GoopModifierData.optional(),
  chainLightningModifier: ChainLightningModifierData.optional(),
  restoreAmmoToGunModifier: RestoreAmmoToGunModifierData.optional(),
  modifyProjectileSynergyProcessor: ModifyProjectileSynergyProcessorData.optional(),
  basicBeamController: BasicBeamControllerData.optional(),
  raidenBeamController: RaidenBeamControllerData.optional(),
  reverseBeamController: ReverseBeamControllerData.optional(),
  blackHoleDoer: BlackHoleDoerData.optional(),
  mindControlProjModifier: MindControlProjectileModifierData.optional(),
  matterAntimatterProjModifier: MatterAntimatterProjectileModifierData.optional(),
  stickyGrenadeBuff: StickyGrenadeBuffData.optional(),
  healthModificationBuff: HealthModificationBuffData.optional(),
  threeWishesBuff: ThreeWishesBuffData.optional(),
  devolverModifier: DevolverModifierData.optional(),
});

export type TProjectileDto = z.infer<typeof ProjectileDto>;
export type TProjectileData = z.infer<typeof ProjectileData>;
export type TCerebralBoreProjectileData = z.infer<typeof CerebralBoreProjectileData>;
export type TBoomerangProjectileData = z.infer<typeof BoomerangProjectileData>;
export type TBeeProjectileData = z.infer<typeof BeeProjectileData>;
export type TRobotechProjectileData = z.infer<typeof RobotechProjectileData>;
export type THelixProjectileData = z.infer<typeof HelixProjectileData>;
export type TBounceProjModifierData = z.infer<typeof BounceProjModifierData>;
export type TPierceProjModifierData = z.infer<typeof PierceProjModifierData>;
export type TExplosiveModifierData = z.infer<typeof ExplosiveModifierData>;
export type THomingModifierData = z.infer<typeof HomingModifierData>;
export type TSpawnProjModifierData = z.infer<typeof SpawnProjModifierData>;
export type TGoodDefinitionData = z.infer<typeof GoopDefinitionData>;
export type TGoopModifierData = z.infer<typeof GoopModifierData>;
export type TChainLightningModifierData = z.infer<typeof ChainLightningModifierData>;
export type TRestoreAmmoToGunModifierData = z.infer<typeof RestoreAmmoToGunModifierData>;
export type TModifyProjectileSynergyProcessorData = z.infer<typeof ModifyProjectileSynergyProcessorData>;
export type TBasicBeamControllerData = z.infer<typeof BasicBeamControllerData>;
export type TRaidenBeamControllerData = z.infer<typeof RaidenBeamControllerData>;
export type TReverseBeamControllerData = z.infer<typeof ReverseBeamControllerData>;
export type TBlackHoleDoerData = z.infer<typeof BlackHoleDoerData>;
export type TMindControlProjectileModifierData = z.infer<typeof MindControlProjectileModifierData>;
export type TMatterAntimatterProjectileModifierData = z.infer<typeof MatterAntimatterProjectileModifierData>;
export type TStickyGrenadeBuffData = z.infer<typeof StickyGrenadeBuffData>;
export type THealthModificationBuffData = z.infer<typeof HealthModificationBuffData>;
export type TThreeWishesBuffData = z.infer<typeof ThreeWishesBuffData>;
export type TDevolverModifierData = z.infer<typeof DevolverModifierData>;
