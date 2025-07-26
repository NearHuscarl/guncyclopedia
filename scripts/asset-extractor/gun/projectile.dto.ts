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

  AppliesSpeedModifier: BinaryOption,
  SpeedApplyChance: z.number(), // not Percentage because of a malformed projectile
  speedEffect: z.object({
    SpeedMultiplier: z.number(),
  }),

  AppliesCharm: BinaryOption,
  CharmApplyChance: Percentage,

  AppliesFreeze: BinaryOption,
  FreezeApplyChance: Percentage,

  AppliesFire: BinaryOption,
  FireApplyChance: Percentage,

  AppliesStun: BinaryOption,
  StunApplyChance: Percentage,

  AppliesCheese: BinaryOption,
  CheeseApplyChance: Percentage,
});

const BounceProjModifierData = z.object({
  numberOfBounces: z.number(),
  chanceToDieOnBounce: z.number(),
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

export const ProjectileDto = z.object({
  id: z.string(),
  projectile: ProjectileData,
  bounceProjModifier: BounceProjModifierData.optional(),
  pierceProjModifier: PierceProjModifierData.optional(),
  homingModifier: HomingModifierData.optional(),
  basicBeamController: BasicBeamControllerData.optional(),
  raidenBeamController: RaidenBeamControllerData.optional(),
});

export type TProjectileDto = z.input<typeof ProjectileDto>;
export type TProjectileData = z.infer<typeof ProjectileData>;
export type TBounceProjModifierData = z.infer<typeof BounceProjModifierData>;
export type TPierceProjModifierData = z.infer<typeof PierceProjModifierData>;
export type THomingModifierData = z.infer<typeof HomingModifierData>;
export type TBasicBeamControllerData = z.infer<typeof BasicBeamControllerData>;
export type TRaidenBeamControllerData = z.infer<typeof RaidenBeamControllerData>;
