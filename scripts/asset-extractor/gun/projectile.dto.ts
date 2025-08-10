import z from "zod/v4";
import { BinaryOption, Percentage } from "../utils/schema.ts";
import { MonoBehaviour } from "../asset/asset.dto.ts";

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
const GameActorHealthEffect = GameActorEffect.extend({
  DamagePerSecondToEnemies: z.number(),
});
const GameActorFreezeEffect = GameActorEffect.extend({
  FreezeAmount: z.number(),
});
const GameActorCheeseEffect = GameActorEffect.extend({
  CheeseAmount: z.number(),
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

  /**
   * `BoomerangProjectile` subclass
   */
  StunDuration: z.number().optional(),
  // TODO: what the heck is bleed effect?
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

const HomingModifierData = z.object({
  HomingRadius: z.number(),
  AngularVelocity: z.number(),
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

export const ProjectileDto = z.object({
  id: z.string(),
  projectile: ProjectileData,
  bounceProjModifier: BounceProjModifierData.optional(),
  pierceProjModifier: PierceProjModifierData.optional(),
  homingModifier: HomingModifierData.optional(),
  basicBeamController: BasicBeamControllerData.optional(),
  raidenBeamController: RaidenBeamControllerData.optional(),
  blackHoleDoer: BlackHoleDoerData.optional(),
});

export type TProjectileDto = z.input<typeof ProjectileDto>;
export type TProjectileData = z.infer<typeof ProjectileData>;
export type TBounceProjModifierData = z.infer<typeof BounceProjModifierData>;
export type TPierceProjModifierData = z.infer<typeof PierceProjModifierData>;
export type THomingModifierData = z.infer<typeof HomingModifierData>;
export type TBasicBeamControllerData = z.infer<typeof BasicBeamControllerData>;
export type TRaidenBeamControllerData = z.infer<typeof RaidenBeamControllerData>;
export type TBlackHoleDoerData = z.input<typeof BlackHoleDoerData>;
