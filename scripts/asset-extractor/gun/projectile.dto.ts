import z from "zod/v4";
import { BinaryOption, Percentage } from "../utils/schema.ts";

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

export const ProjectileDto = z.object({
  $$name: z.string(),
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

export type TProjectileDto = z.input<typeof ProjectileDto>;
