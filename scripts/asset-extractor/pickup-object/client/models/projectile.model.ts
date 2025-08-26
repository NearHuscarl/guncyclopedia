import z from "zod/v4";
import { Animation } from "./animation.model.ts";
import { Percentage } from "./schema.ts";

export type TStatusEffectProp =
  | "poisonChance"
  | "speedChance"
  | "charmChance"
  | "freezeChance"
  | "fireChance"
  | "stunChance"
  | "cheeseChance"
  | "chanceToTransmogrify";

export const Projectile = z.object({
  /**
   * basename of the meta file that associates with the prefab file
   */
  id: z.string(),
  ignoreDamageCaps: z.boolean().optional(),
  damage: z.number(),
  speed: z.number(),
  range: z.number(),
  force: z.number(),

  /**
   * Extra damage from explosion, ricochet, or custom projectile like blackhole
   */
  additionalDamage: z.array(
    z.object({
      type: z.enum(["dps", "instant"]).optional().default("instant"),
      /**
       * If `isEstimated` is true, the damage is an estimate based on the best outcome.
       *
       * E.g. for ricochets, the damage is computed as if all bounces hit an enemy.
       */
      isEstimated: z.boolean().optional(),
      /**
       * If `canNotStack` is true, all damages with the same source can only be applied once.
       */
      canNotStack: z.boolean().optional(),
      source: z.enum([
        "ricochet",
        "blackhole",
        "fire",
        "poison",
        "explosion",
        "oilGoop",
        "damageMultiplier",
        "transmogrification",
      ]),
      damage: z.number(),
    }),
  ),

  /**
   * Chance to spawn this projectile = `spawnWeight / projectileModes.length`.
   */
  spawnWeight: z.number().optional(),

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
  /**
   * Chance to die on bounce. Default is `0`.
   */
  chanceToDieOnBounce: Percentage.optional(),
  damageMultiplierOnBounce: z.number().nonnegative().optional(),

  /**
   * The number of times the projectile can pierce through enemies or objects.
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

  isHoming: z.boolean().optional(),
  homingRadius: z.number().optional(),
  homingAngularVelocity: z.number().optional(),

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
   * Some projectiles are invisible hence no animation.
   */
  animation: Animation.optional(),
});

export type TProjectile = z.input<typeof Projectile>;
