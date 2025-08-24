import z from "zod/v4";
import clamp from "lodash/clamp";
import type { ArrayKeys, BooleanKeys, NumericKeys, StringKeys } from "@/lib/types";
import type { TProjectilePerShot } from "../generated/models/gun.model";
import type { TProjectile, TStatusEffectProp } from "../generated/models/projectile.model";

type AggregateModeOption = "sum" | "avg";
type AggregateMode = "sum" | "avg" | "max" | ((projectiles: TProjectile[]) => number);
type NumericAggregateConfig = {
  [K in NumericKeys<TProjectile>]: [avg?: AggregateMode, sum?: AggregateMode];
};
type BooleanAggregateConfig = {
  [K in BooleanKeys<TProjectile>]: true;
};
type StringAggregateConfig = {
  [K in StringKeys<TProjectile>]: boolean;
};
type ArrayAggregateConfig = {
  [K in ArrayKeys<TProjectile>]: true;
};

export const RangeLabel = z.enum(["short-range", "mid-range", "long-range"]);
export type TRangeLabel = z.infer<typeof RangeLabel>;

export class ProjectileService {
  static getRange(value: number) {
    return value >= 1000 ? Infinity : value;
  }
  static getSpeed(value: number) {
    return value === -1 ? Infinity : value;
  }
  static getMaxAmmo(value: number) {
    return value >= 10_000 ? Infinity : value;
  }
  static getRangeLabel(projectile: TProjectile): TRangeLabel {
    if (projectile.range <= 15) {
      return "short-range";
    } else if (projectile.range <= 60) {
      return "mid-range";
    }
    return "long-range";
  }

  static calculateStatusEffectChance(projectiles: TProjectile[], statusEffectProp: TStatusEffectProp): number {
    let probabilityNone = 1;

    // Calculate the probability that none of the projectiles apply the effect
    for (const projectile of projectiles) {
      const statusEffectChance = projectile[statusEffectProp] ?? 0;
      probabilityNone *= 1 - statusEffectChance;
    }

    // The probability of at least one applying the effect
    const probabilityAtLeastOne = 1 - probabilityNone;

    return probabilityAtLeastOne;
  }

  /**
   * Converts gun spread in degrees to a precision value (0–100).
   *
   * A higher spread means lower precision. This function inverts and scales
   * the spread range [30 (worst) .. 0 (best)] into a precision percentage
   * [0 (worst) .. 100 (best)].
   */
  static toPrecision(spread: number): number {
    const maxSpread = 30;
    const clamped = clamp(spread, 0, maxSpread);
    return ((maxSpread - clamped) / maxSpread) * 100;
  }

  static createAggregatedProjectile(projectiles: TProjectilePerShot[]) {
    const pp = projectiles.map((p) => this.createAggregatedProjectileData(p.projectiles, "avg"));
    if (pp.length === 0) {
      throw new Error("Cannot compute average projectile from an empty list.");
    }
    const finalProjectile: TProjectilePerShot = {
      cooldownTime: 0,
      spread: 0,
      burstShotCount: projectiles[0].burstShotCount,
      burstCooldownTime: projectiles[0].burstCooldownTime,
      shootStyle: projectiles[0].shootStyle,
      projectiles: [this.createAggregatedProjectileData(pp, "sum")],
    };
    for (let i = 0; i < projectiles.length; i++) {
      const proj = projectiles[i];
      finalProjectile.cooldownTime = Math.max(finalProjectile.cooldownTime, proj.cooldownTime);
      finalProjectile.spread = Math.max(finalProjectile.spread, proj.spread);
    }

    return finalProjectile;
  }

  private static _aggregateAdditionalDamage(
    projectiles: TProjectile[],
    mode: AggregateModeOption,
    sums: Record<string, number>,
  ) {
    const additionaDmgLookup: Record<string, TProjectile["additionalDamage"][number]> = {};

    for (const p of projectiles) {
      for (const d of p.additionalDamage) {
        if (!additionaDmgLookup[d.source]) {
          additionaDmgLookup[d.source] = { ...d, damage: 0 };
        }
        if (d.canNotStack) {
          additionaDmgLookup[d.source].damage = Math.max(additionaDmgLookup[d.source].damage, d.damage);
        } else {
          // other fields should be the same, so we can just sum the damage
          additionaDmgLookup[d.source].damage += d.damage;
        }
      }
    }

    if (mode === "avg") {
      for (const key in additionaDmgLookup) {
        if (additionaDmgLookup[key].canNotStack) continue;
        additionaDmgLookup[key].damage /= projectiles.length;
      }
    }

    // post-processing
    for (const key in additionaDmgLookup) {
      const chance = sums[`${key}Chance`];
      if (chance !== undefined && chance < 1) {
        additionaDmgLookup[key].isEstimated = true;
      }
    }

    return Object.values(additionaDmgLookup);
  }

  /**
   * Compute an 'aggregated' projectile from a list.
   *
   * - Numeric & percentage fields are averaged; missing values are `0`
   *   (`spawnWeight` is always `1` as there is only one projectile).
   * - Boolean fields default to `false`; the result is `true` if any
   *   projectile has `true`. E.g. if this gun has homing projectiles,
   *
   * @throws {Error} if the input array is empty.
   */
  static createAggregatedProjectileData(projectiles: TProjectile[], mode: AggregateModeOption): TProjectile {
    if (projectiles.length === 0) {
      throw new Error("Cannot average an empty projectile list.");
    }

    // All numeric (and percentage) keys that should be averaged.
    const nAggregateConfig: NumericAggregateConfig = {
      damage: ["avg", "sum"],
      speed: ["avg", "avg"],
      range: ["avg", "max"],
      force: ["avg", "sum"],
      spawnWeight: [],
      poisonChance: ["avg", (p) => this.calculateStatusEffectChance(p, "poisonChance")],
      poisonDuration: ["avg", "avg"],
      speedChance: ["avg", (p) => this.calculateStatusEffectChance(p, "speedChance")],
      speedDuration: ["avg", "avg"],
      speedMultiplier: ["avg", "max"],
      charmChance: ["avg", (p) => this.calculateStatusEffectChance(p, "charmChance")],
      charmDuration: ["avg", "avg"],
      freezeChance: ["avg", (p) => this.calculateStatusEffectChance(p, "freezeChance")],
      freezeDuration: ["avg", "avg"],
      freezeAmount: ["avg", "max"],
      fireChance: ["avg", (p) => this.calculateStatusEffectChance(p, "fireChance")],
      fireDuration: ["avg", "avg"],
      stunChance: ["avg", (p) => this.calculateStatusEffectChance(p, "stunChance")],
      stunDuration: ["avg", "avg"],
      cheeseChance: ["avg", (p) => this.calculateStatusEffectChance(p, "cheeseChance")],
      cheeseDuration: ["avg", "avg"],
      cheeseAmount: ["avg", "max"],
      numberOfBounces: ["avg", "avg"],
      chanceToDieOnBounce: ["avg", "avg"],
      damageMultiplierOnBounce: ["avg", "avg"],
      penetration: ["avg", "max"],
      homingRadius: ["avg", "max"],
      homingAngularVelocity: ["avg", "avg"],
      beamChargeTime: ["max", "max"],
      beamStatusEffectChancePerSecond: ["max", "max"],
      explosionForce: ["avg", "sum"],
      explosionRadius: ["avg", "max"],
      explosionFreezeRadius: ["avg", "max"],
      goopCollisionRadius: ["avg", "max"],
      chanceToTransmogrify: ["avg", (p) => this.calculateStatusEffectChance(p, "chanceToTransmogrify")],
    };

    // All boolean keys that are aggregated with logical-OR.
    const bAggregateConfig: BooleanAggregateConfig = {
      ignoreDamageCaps: true,
      canPenetrateObjects: true,
      isHoming: true,
      damageAllEnemies: true,
      hasOilGoop: true,
      spawnGoopOnCollision: true,
    };
    // All string keys that are aggregated into arrays of string
    const sAggregateConfig: StringAggregateConfig = {
      id: false,
      transmogrifyTarget: true,
    };
    // @ts-expect-error alert linter to update new properties
    const _aAggregateConfig: ArrayAggregateConfig = {
      additionalDamage: true,
    };

    // ---------- aggregate ----------
    const sums: Record<string, number> = {};
    Object.keys(nAggregateConfig).forEach((k) => (sums[k] = 0));

    const strSums: Record<string, string[]> = {};
    Object.keys(sAggregateConfig).forEach((k) => (strSums[k] = []));

    const hasTrue: Record<string, boolean> = {};
    Object.keys(bAggregateConfig).forEach((k) => (hasTrue[k] = false));

    for (const p of projectiles) {
      for (const [k, [avg, sum]] of Object.entries(nAggregateConfig)) {
        const key = k as NumericKeys<TProjectile>;
        const m = mode === "avg" ? avg : sum;

        if (m === "max") {
          sums[key] = Math.max(sums[key], p[key] ?? 0);
        } else if (m === "avg" || m === "sum") {
          sums[key] += p[key] ?? 0;
        }
      }

      Object.keys(bAggregateConfig).forEach((k) => {
        const key = k as BooleanKeys<TProjectile>;
        const v = p[key] ?? false;
        hasTrue[key] = hasTrue[key] || v;
      });

      Object.keys(sAggregateConfig).forEach((k) => {
        if (!sAggregateConfig[k as StringKeys<TProjectile>]) return;
        const key = k as StringKeys<TProjectile>;
        const v = p[key];
        if (v) strSums[key].push(v);
      });
    }
    for (const [k, [avg, sum]] of Object.entries(nAggregateConfig)) {
      const key = k as NumericKeys<TProjectile>;
      const m = mode === "avg" ? avg : sum;

      if (m === "avg") {
        sums[key] /= projectiles.length;
      } else if (typeof m === "function") {
        sums[key] = m(projectiles);
      }
    }

    // ---------- build result ----------
    const final: Partial<TProjectile> = {
      id: "average",
      spawnWeight: 1,
      additionalDamage: this._aggregateAdditionalDamage(projectiles, mode, sums),
    };

    Object.keys(nAggregateConfig).forEach((k) => (final[k as NumericKeys<TProjectile>] = sums[k]));
    Object.keys(bAggregateConfig).forEach((k) => (final[k as BooleanKeys<TProjectile>] = hasTrue[k]));
    Object.keys(sAggregateConfig).forEach((k) => (final[k as StringKeys<TProjectile>] = strSums[k].join(", ")));

    return final as TProjectile;
  }
}
