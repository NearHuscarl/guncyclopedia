import z from "zod/v4";
import { Animation, CompactedFrame, RichFrame } from "./animation.model.ts";
import { Percentage } from "./schema.ts";

export const DamageAllEnemiesRadius = {
  Screen: 10,
  Room: 20,
} as const;

export type TStatusEffectProp =
  | "poisonChance"
  | "speedChance"
  | "charmChance"
  | "freezeChance"
  | "fireChance"
  | "stunChance"
  | "cheeseChance"
  | "chanceToTransmogrify"
  | "devolveChance";

const DamageDetail = z.object({
  type: z.enum(["dps", "instant"]),
  /**
   * Probability that this damage will actually occur. Default to `0` (never happen).
   *
   * Used for chance-based effects such as status effect, piercing, or other random outcomes.
   *
   * The value may be derived from known mechanics or be an informed estimate when the exact data
   * is unavailable.
   *
   * - If `damageChance = 0` and `isEstimated = true`, the chance is considered unknown rather than 'never happen'.
   * - If `damageChance >= 0`, the damage is estimated regardless of `isEstimated`.
   */
  damageChance: Percentage.optional(),
  /**
   * Whether the damage is an estimate or not. Use this over `damageChance`
   * If the damage chance is unclear
   */
  isEstimated: z.boolean().optional(),
  /**
   * If `canNotStack` is true, all damages with the same source can only be applied once.
   */
  canNotStack: z.boolean().optional(),
  source: z.enum([
    "ricochet",
    "pierce",
    "blackhole",
    "fire",
    "poison",
    "explosion",
    "oilGoop",
    "damageMultiplier",
    "transmogrification",
    "devolver",
    "bee",
  ]),
  damage: z.number(),
});

export const Projectile = z.object({
  /**
   * basename of the meta file that associates with the prefab file
   */
  id: z.string(),
  gunId: z.number(),
  ignoreDamageCaps: z.boolean().optional(),
  damage: z.number(),
  speed: z.number(),
  range: z.number(),
  force: z.number(),

  /**
   * Extra damage from explosion, ricochet, or custom projectile like blackhole
   */
  additionalDamage: z.array(DamageDetail),

  poisonChance: Percentage.optional(),
  poisonDuration: z.number().optional(),

  speedChance: Percentage.optional(),
  speedDuration: z.number().optional(),
  speedMultiplier: z.number().optional(),

  charmChance: Percentage.optional(),
  charmDuration: z.number().optional(),

  freezeChance: Percentage.optional(),
  freezeDuration: z.number().optional(),
  freezeAmount: z.number().optional(),

  fireChance: Percentage.optional(),
  fireDuration: z.number().optional(),

  stunChance: Percentage.optional(),
  stunDuration: z.number().optional(),

  cheeseChance: Percentage.optional(),
  cheeseDuration: z.number().optional(),
  cheeseAmount: z.number().optional(),

  numberOfBounces: z.number().optional(),
  averageSurvivingBounces: z.number().optional(),
  /**
   * Chance to die on bounce. Default is `0`.
   */
  chanceToDieOnBounce: Percentage.optional(),
  damageMultiplierOnBounce: z.number().nonnegative().optional(),

  /**
   * The number of times the projectile can pierce through enemies or objects.
   *
   * Note: when a projectile is both piercing & explosive, it can hit multiple objects
   * but explode on impact with the first enemy.
   */
  penetration: z.number().optional(),
  canPenetrateObjects: z.boolean().optional(),

  explosionRadius: z.number().optional(),
  explosionForce: z.number().optional(),
  explosionFreezeRadius: z.number().optional(),

  /**
   * Instantly damage all enemies in the room/viewport
   */
  damageAllEnemies: z.boolean().optional(),
  damageAllEnemiesRadius: z.number().optional(),

  isHoming: z.boolean().optional(),
  homingRadius: z.number().optional(),
  homingAngularVelocity: z.number().optional(),

  spawnProjectilesInflight: z.boolean().optional(),
  /**
   * The number of projectiles to spawn per second while the projectile is in flight.
   */
  spawnProjectilesInflightPerSecond: z.number().optional(),
  spawnProjectilesOnCollision: z.boolean().optional(),
  spawnCollisionProjectilesOnBounce: z.boolean().optional(),
  spawnProjectileNumber: z.number().optional(),
  /**
   * The maximum number of projectiles that can be spawned if the projectile
   * can bounce successfully and `spawnCollisionProjectilesOnBounce` is true.
   */
  spawnProjectileMaxNumber: z.number().optional(),
  spawnProjectile: z.string().optional(),

  beamChargeTime: z.number().optional(),
  /**
   * Chance to apply a status effect per second.
   *
   * If a beam weapon has status effects, the default is `1`
   *
   * For [Science Cannon](https://enterthegungeon.fandom.com/wiki/Science_Cannon), multiple effects can be applied at the same time.
   */
  beamStatusEffectChancePerSecond: Percentage.optional(),

  hasOilGoop: z.boolean().optional(),
  spawnGoopOnCollision: z.boolean().optional(),
  goopCollisionRadius: z.number().optional(),

  chanceToTransmogrify: z.number().optional(),
  transmogrifyTarget: z.string().optional(),

  /**
   * whether Jammed enemies and bosses hit by the projectile will revert to normal.
   */
  dejam: z.boolean().optional(),
  /**
   * Creates a blank on collision, with the exact condition depending on the projectile.
   */
  blankOnCollision: z.boolean().optional(),

  /**
   * https://enterthegungeon.fandom.com/wiki/3rd_Party_Controller
   */
  mindControl: z.boolean().optional(),

  /**
   * https://enterthegungeon.fandom.com/wiki/Sticky_Crossbow
   */
  sticky: z.boolean().optional(),

  /**
   * Target like homing but slow down when facing the opposite of the enemy
   * and speed up after aligning with the target.
   */
  isBeeLikeTargetBehavior: z.boolean().optional(),
  /**
   * Is it a fake bee or the actual bee. The real bee projectile deals extra sting damage.
   */
  isBee: z.boolean().optional(),
  beeStingDuration: z.number().optional(),

  /**
   * https://enterthegungeon.fandom.com/wiki/Black_Hole_Gun
   */
  isBlackhole: z.boolean().optional(),

  /**
   * https://enterthegungeon.fandom.com/wiki/Devolver
   */
  devolveChance: z.number().optional(),
  devolveTarget: z.string().optional(),

  /**
   * Moves in a wave pattern: https://enterthegungeon.fandom.com/wiki/Helix
   */
  helixAmplitude: z.number().optional(),
  helixWavelength: z.number().optional(),
  antimatter: z.boolean().optional(),

  /**
   * Some projectiles are invisible hence no animation.
   */
  animation: Animation.optional(),
});

const createDerivedProjSchema = <T extends z.ZodTypeAny>(frameSchema: T) => {
  const AnimationSchema = Animation.extend({ frames: z.array(frameSchema) });
  return Projectile.extend({
    animation: AnimationSchema.optional(),
  });
};

export const ProjectileForStorage = createDerivedProjSchema(CompactedFrame);
export const ProjectileFromStorage = createDerivedProjSchema(RichFrame);

export type TDamageDetail = z.infer<typeof DamageDetail>;
export type TProjectile = z.infer<typeof Projectile>;
export type TProjectileForStorage = z.infer<typeof ProjectileForStorage>;
export type TProjectileId = TProjectile["id"];
