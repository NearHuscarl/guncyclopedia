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

const ModifyProjectileSynergyProcessorData = z.object({
  /**
   * Note: This belongs to a synergy that is ALWAYS inactive.
   * But the synergy gives an exception to `Dejams` property as long as it's set to true
   */
  Dejams: BinaryOption,
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
});

const BlackHoleDoerData = z.object({
  damageRadius: z.number(),
  damageToEnemiesPerSecond: z.number(),
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

const CerebralBoreProjectileData = ProjectileData.extend({
  explosionData: ExplosiveModifierData.shape.explosionData,
});

export const ProjectileDto = z.object({
  id: z.string(),
  projectile: z.union([CerebralBoreProjectileData, ProjectileData]),
  sprite: SpriteData.optional(),
  spriteAnimator: SpriteAnimatorData.optional(),
  bounceProjModifier: BounceProjModifierData.optional(),
  pierceProjModifier: PierceProjModifierData.optional(),
  explosiveModifier: ExplosiveModifierData.optional(),
  homingModifier: HomingModifierData.optional(),
  goopModifier: GoopModifierData.optional(),
  modifyProjectileSynergyProcessor: ModifyProjectileSynergyProcessorData.optional(),
  basicBeamController: BasicBeamControllerData.optional(),
  raidenBeamController: RaidenBeamControllerData.optional(),
  blackHoleDoer: BlackHoleDoerData.optional(),
});

export type TProjectileDto = z.input<typeof ProjectileDto>;
export type TProjectileData = z.infer<typeof ProjectileData>;
export type TCerebralBoreProjectileData = z.infer<typeof CerebralBoreProjectileData>;
export type TBounceProjModifierData = z.infer<typeof BounceProjModifierData>;
export type TPierceProjModifierData = z.infer<typeof PierceProjModifierData>;
export type TExplosiveModifierData = z.infer<typeof ExplosiveModifierData>;
export type THomingModifierData = z.infer<typeof HomingModifierData>;
export type TGoodDefinitionData = z.infer<typeof GoopDefinitionData>;
export type TGoopModifierData = z.infer<typeof GoopModifierData>;
export type TModifyProjectileSynergyProcessorData = z.infer<typeof ModifyProjectileSynergyProcessorData>;
export type TBasicBeamControllerData = z.infer<typeof BasicBeamControllerData>;
export type TRaidenBeamControllerData = z.infer<typeof RaidenBeamControllerData>;
export type TBlackHoleDoerData = z.input<typeof BlackHoleDoerData>;
