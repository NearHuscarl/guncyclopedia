import z from "zod/v4";

export const StatType = {
  MovementSpeed: 0,
  RateOfFire: 1,
  Accuracy: 2,
  Health: 3,
  Coolness: 4,
  Damage: 5,
  ProjectileSpeed: 6,
  AdditionalGunCapacity: 7,
  AdditionalItemCapacity: 8,
  AmmoCapacityMultiplier: 9,
  ReloadSpeed: 10,
  AdditionalShotPiercing: 11,
  KnockbackMultiplier: 12,
  GlobalPriceMultiplier: 13,
  Curse: 14,
  PlayerBulletScale: 15,
  AdditionalClipCapacityMultiplier: 16,
  AdditionalShotBounces: 17,
  AdditionalBlanksPerFloor: 18,
  ShadowBulletChance: 19,
  ThrownGunDamage: 20,
  DodgeRollDamage: 21,
  DamageToBosses: 22,
  EnemyProjectileSpeedMultiplier: 23,
  ExtremeShadowBulletChance: 24,
  ChargeAmountMultiplier: 25,
  RangeMultiplier: 26,
  DodgeRollDistanceMultiplier: 27,
  DodgeRollSpeedMultiplier: 28,
  TarnisherClipCapacityMultiplier: 29,
  MoneyMultiplierFromEnemies: 30,
} as const;

export const ModifyMethod = {
  ADDITIVE: 0,
  MULTIPLICATIVE: 1,
} as const;

export const StatModifier = {
  StatType,
  ModifyMethod,
};

export const StatModifierSchema = z.object({
  statToBoost: z.enum(StatModifier.StatType),
  modifyType: z.enum(StatModifier.ModifyMethod),
  amount: z.number(),
});

export const PlayerDto = z.object({
  $$id: z.string(),
  startingGunIds: z.array(z.number()),
  startingActiveItemIds: z.array(z.number()),
  startingPassiveItemIds: z.array(z.number()),
});

export type TPlayerDto = z.input<typeof PlayerDto>;
