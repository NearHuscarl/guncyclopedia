import clamp from "lodash/clamp";
import type { ArrayKeys, BooleanKeys, NumericKeys } from "@/lib/types";
import type { TProjectile, TProjectilePerShot } from "../generated/models/gun.model";

type AggregateModeOption = "sum" | "avg";
type AggregateMode = "sum" | "avg" | "max";
type NumericAggregateConfig = {
  [K in NumericKeys<TProjectile>]: [avg?: AggregateMode, sum?: AggregateMode];
};
type BooleanAggregateConfig = {
  [K in BooleanKeys<TProjectile>]: true;
};
type ArrayAggregateConfig = {
  [K in ArrayKeys<TProjectile>]: true;
};

export class ProjectileService {
  static getRange(value: number) {
    return value >= 1000 ? Infinity : value;
  }
  static getSpeed(value: number) {
    return value === -1 ? Infinity : value;
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
      poisonChance: ["avg", "max"],
      speedChance: ["avg", "max"],
      charmChance: ["avg", "max"],
      freezeChance: ["avg", "max"],
      fireChance: ["avg", "max"],
      stunChance: ["avg", "max"],
      cheeseChance: ["avg", "max"],
      numberOfBounces: ["avg", "avg"],
      chanceToDieOnBounce: ["avg", "avg"],
      damageMultiplierOnBounce: ["avg", "avg"],
      penetration: ["avg", "max"],
      homingRadius: ["avg", "avg"],
      homingAngularVelocity: ["avg", "avg"],
      beamChargeTime: ["max", "max"],
      beamStatusEffectChancePerSecond: ["max", "max"],
      // TODO: add "dps" once you’ve decided to include it
    };

    // All boolean keys that are aggregated with logical‐AND.
    const bAggregateConfig: BooleanAggregateConfig = {
      ignoreDamageCaps: true,
      canPenetrateObjects: true,
      isHoming: true,
      damageAllEnemies: true,
    };
    //
    // @ts-expect-error alert linter to update new properties
    const _aAggregateConfig: ArrayAggregateConfig = {
      additionalDamage: true,
    };

    // ---------- aggregate ----------
    const sums: Record<string, number> = {};
    Object.keys(nAggregateConfig).forEach((k) => (sums[k] = 0));

    const hasTrue: Record<string, boolean> = {};
    Object.keys(bAggregateConfig).forEach((k) => (hasTrue[k] = true));

    const additionaDmg: Record<string, TProjectile["additionalDamage"][number]> = {};

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
        const v = p[key] ?? true; // default to true
        hasTrue[key] = hasTrue[key] || v;
      });

      if (mode === "sum") {
        for (const d of p.additionalDamage) {
          if (!additionaDmg[d.source]) {
            additionaDmg[d.source] = { ...d, damage: 0 };
          }
          // other fields should be the same, so we can just sum the damage
          additionaDmg[d.source].damage += d.damage;
        }
      } else if (mode === "avg") {
        if (p.additionalDamage.length > 1) {
          console.log(p);
          throw new Error(
            `Calculate average array field of additionalDamage with more than one element is not implemented.`,
          );
        } else if (p.additionalDamage.length === 1) {
          additionaDmg[p.additionalDamage[0].source] = { ...p.additionalDamage[0] };
        }
      }
    }
    for (const [k, [avg, sum]] of Object.entries(nAggregateConfig)) {
      const key = k as NumericKeys<TProjectile>;
      const m = mode === "avg" ? avg : sum;

      if (m === "avg") {
        sums[key] /= projectiles.length;
      }
    }

    // ---------- build result ----------
    const final: Partial<TProjectile> = { id: "average", spawnWeight: 1 };

    Object.keys(nAggregateConfig).forEach((k) => (final[k as NumericKeys<TProjectile>] = sums[k]));
    Object.keys(bAggregateConfig).forEach((k) => (final[k as BooleanKeys<TProjectile>] = hasTrue[k]));
    final.additionalDamage = Object.values(additionaDmg);

    return final as TProjectile;
  }
}
