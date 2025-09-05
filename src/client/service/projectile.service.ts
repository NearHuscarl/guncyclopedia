import z from "zod/v4";
import clamp from "lodash/clamp";
import type { ArrayKeys, BooleanKeys, NumericKeys, StringKeys } from "@/lib/types";
import type { TResolvedProjectile } from "./game-object.service";

type AggregateModeOption = "volley" | "random";
type AggregateMode = "sum" | "avg" | "max" | ((projectiles: TResolvedProjectile[]) => number);
type NumericAggregateConfig = {
  [K in NumericKeys<TResolvedProjectile>]: [random?: AggregateMode, volley?: AggregateMode];
};
type BooleanAggregateConfig = {
  [K in BooleanKeys<TResolvedProjectile>]: true;
};
type StringAggregateConfig = {
  [K in StringKeys<TResolvedProjectile>]: boolean;
};
type ArrayAggregateConfig = {
  [K in ArrayKeys<TResolvedProjectile>]: true;
};

export const RangeLabel = z.enum(["short-range", "mid-range", "long-range"]);
export type TRangeLabel = z.infer<typeof RangeLabel>;

export class ProjectileService {
  static readonly MAX_SPEED = 10_000;
  static readonly MAX_FIRE_RATE = 10_000;
  static readonly MAX_MAX_AMMO = 10_000;
  static readonly MAX_RANGE = 1000;

  static getFireRate(value: number) {
    return value >= ProjectileService.MAX_FIRE_RATE ? Infinity : value;
  }
  static getRange(value: number) {
    return value >= ProjectileService.MAX_RANGE ? Infinity : value;
  }
  static getSpeed(value: number) {
    return value >= ProjectileService.MAX_SPEED ? Infinity : value;
  }
  static getMaxAmmo(value: number) {
    return value >= ProjectileService.MAX_MAX_AMMO ? Infinity : value;
  }
  static getRangeLabel(projectile: TResolvedProjectile): TRangeLabel {
    if (projectile.range <= 15) {
      return "short-range";
    } else if (projectile.range <= 60) {
      return "mid-range";
    }
    return "long-range";
  }

  /**
   * Calculates the chance of a status effect being applied by a volley of projectiles.
   */
  static calculateVolleyChance(
    volley: TResolvedProjectile[],
    chanceGetter: (p: TResolvedProjectile) => number | undefined,
  ): number {
    let probabilityNone = 1;

    // Calculate the probability that none of the projectiles apply the effect
    for (const projectile of volley) {
      const statusEffectChance = chanceGetter(projectile) ?? 0;
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

  private static _aggregateAdditionalDamage(
    projectiles: TResolvedProjectile[],
    mode: AggregateModeOption,
    sums: Record<string, number>,
  ) {
    const res: Record<string, TResolvedProjectile["additionalDamage"][number]> = {};

    // aggregate additionalDamage.damage
    for (const p of projectiles) {
      for (const d of p.additionalDamage) {
        if (!res[d.source]) {
          res[d.source] = { ...d, damage: 0, damageChance: 0 };
        }
        if (d.canNotStack) {
          res[d.source].damage = Math.max(res[d.source].damage, d.damage);
        } else {
          // other fields should be the same, so we can just sum the damage
          res[d.source].damage += d.damage;
        }

        res[d.source].damageChance = d.damageChance ?? 0;
      }
    }

    if (mode === "random") {
      for (const key in res) {
        res[key].damageChance = (res[key].damageChance ?? 0) / projectiles.length;

        if (res[key].canNotStack) continue;
        res[key].damage /= projectiles.length;
      }
    } else if (mode === "volley") {
      for (const key in res) {
        res[key].damageChance = this.calculateVolleyChance(
          projectiles,
          (proj) => proj.additionalDamage.find((ad) => ad.source === key)?.damageChance,
        );
      }
    }

    // post-processing
    for (const key in res) {
      // after aggregation, damageChance is always set to 0 if unset, delete if not an estimation.
      if (!res[key].damageChance && !res[key].isEstimated) {
        delete res[key].damageChance;
        delete res[key].isEstimated;
      }
      const chance = sums[`${key}Chance`];
      if (chance !== undefined && chance < 1) {
        res[key].isEstimated = true;
      }
    }

    return Object.values(res);
  }

  // All numeric (and percentage) keys that should be averaged.
  private static readonly _nAggregateConfig: NumericAggregateConfig = {
    gunId: [],
    damage: ["avg", "sum"],
    dps: ["avg", "sum"],
    speed: ["avg", "avg"],
    range: ["avg", "max"],
    force: ["avg", "sum"],
    poisonChance: ["avg", (p) => this.calculateVolleyChance(p, (proj) => proj.poisonChance)],
    poisonDuration: ["avg", "avg"],
    speedChance: ["avg", (p) => this.calculateVolleyChance(p, (proj) => proj.speedChance)],
    speedDuration: ["avg", "avg"],
    speedMultiplier: ["avg", "max"],
    charmChance: ["avg", (p) => this.calculateVolleyChance(p, (proj) => proj.charmChance)],
    charmDuration: ["avg", "avg"],
    freezeChance: ["avg", (p) => this.calculateVolleyChance(p, (proj) => proj.freezeChance)],
    freezeDuration: ["avg", "avg"],
    freezeAmount: ["avg", "max"],
    fireChance: ["avg", (p) => this.calculateVolleyChance(p, (proj) => proj.fireChance)],
    fireDuration: ["avg", "avg"],
    stunChance: ["avg", (p) => this.calculateVolleyChance(p, (proj) => proj.stunChance)],
    stunDuration: ["avg", "avg"],
    cheeseChance: ["avg", (p) => this.calculateVolleyChance(p, (proj) => proj.cheeseChance)],
    cheeseDuration: ["avg", "avg"],
    cheeseAmount: ["avg", "max"],
    numberOfBounces: ["avg", "avg"],
    chanceToDieOnBounce: ["avg", "avg"],
    damageMultiplierOnBounce: ["avg", "avg"],
    averageSurvivingBounces: ["avg", "avg"],
    penetration: ["avg", "max"],
    homingRadius: ["avg", "max"],
    homingAngularVelocity: ["avg", "avg"],
    beamChargeTime: ["max", "max"],
    beamStatusEffectChancePerSecond: ["max", "max"],
    explosionForce: ["avg", "sum"],
    explosionRadius: ["avg", "max"],
    explosionFreezeRadius: ["avg", "max"],
    goopCollisionRadius: ["avg", "max"],
    chanceToTransmogrify: ["avg", (p) => this.calculateVolleyChance(p, (proj) => proj.chanceToTransmogrify)],
    helixAmplitude: ["avg", "max"],
    helixWavelength: ["avg", "max"],
    devolveChance: ["avg", (p) => this.calculateVolleyChance(p, (proj) => proj.devolveChance)],
    spawnProjectileNumber: ["avg", "sum"],
    spawnProjectileMaxNumber: ["avg", "sum"],
    spawnLevel: ["max", "max"],
    spawnProjectilesInflightPerSecond: ["max", "max"],
    damageAllEnemiesRadius: ["max", "max"],
    beeStingDuration: ["avg", "max"],
  };

  // All boolean keys that are aggregated with logical-OR.
  private static readonly _bAggregateConfig: BooleanAggregateConfig = {
    ignoreDamageCaps: true,
    canPenetrateObjects: true,
    isHoming: true,
    damageAllEnemies: true,
    hasOilGoop: true,
    spawnGoopOnCollision: true,
    dejam: true,
    mindControl: true,
    antimatter: true,
    blankOnCollision: true,
    sticky: true,
    isBlackhole: true,
    spawnCollisionProjectilesOnBounce: true,
    spawnProjectilesInflight: true,
    spawnProjectilesOnCollision: true,
    isBeeLikeTargetBehavior: true,
    isBee: true,
  };
  // All string keys that are aggregated into arrays of string
  private static readonly _sAggregateConfig: StringAggregateConfig = {
    id: true,
    transmogrifyTarget: true,
    devolveTarget: true,
    spawnProjectile: true,
    spawnedBy: true,
  };
  // @ts-expect-error alert linter to update new properties
  private static readonly _aAggregateConfig: ArrayAggregateConfig = {
    additionalDamage: true,
  };

  private static _booleanConfigEntries(
    cb: (key: BooleanKeys<TResolvedProjectile>, value: BooleanAggregateConfig[keyof BooleanAggregateConfig]) => void,
  ): void {
    Object.entries(this._bAggregateConfig).forEach(([k, v]) => cb(k as BooleanKeys<TResolvedProjectile>, v));
  }

  private static _stringConfigEntries(
    cb: (key: StringKeys<TResolvedProjectile>, value: StringAggregateConfig[keyof StringAggregateConfig]) => void,
  ): void {
    Object.entries(this._sAggregateConfig).forEach(([k, v]) => cb(k as StringKeys<TResolvedProjectile>, v));
  }

  private static _numericConfigEntries(
    cb: (key: NumericKeys<TResolvedProjectile>, value: NumericAggregateConfig[keyof NumericAggregateConfig]) => void,
  ): void {
    Object.entries(this._nAggregateConfig).forEach(([k, v]) => cb(k as NumericKeys<TResolvedProjectile>, v));
  }

  /**
   * Compute an 'aggregated' projectile from a list.
   *
   * - Numeric & percentage fields are averaged; missing values are `0`
   * - Boolean fields default to `false`; the result is `true` if any
   *   projectile has `true`. E.g. if this gun has homing projectiles,
   *
   * @throws {Error} if the input array is empty.
   */
  static createAggregatedProjectile(
    projectiles: TResolvedProjectile[],
    mode: AggregateModeOption,
  ): TResolvedProjectile {
    if (projectiles.length === 0) {
      throw new Error("Cannot average an empty projectile list.");
    }

    // ---------- aggregate ----------
    const sums: Record<string, number> = {};
    this._numericConfigEntries((k) => (sums[k] = 0));

    const strSums: Record<string, Set<string>> = {};
    this._stringConfigEntries((k) => (strSums[k] = new Set()));

    const hasTrue: Record<string, boolean> = {};
    this._booleanConfigEntries((k) => (hasTrue[k] = false));

    for (const p of projectiles) {
      this._numericConfigEntries((k, [random, volley]) => {
        const m = mode === "random" ? random : volley;

        if (m === "max") {
          sums[k] = Math.max(sums[k], p[k] ?? 0);
        } else if (m === "avg" || m === "sum") {
          sums[k] += p[k] ?? 0;
        }
      });

      this._booleanConfigEntries((k) => {
        const v = p[k] ?? false;
        hasTrue[k] = hasTrue[k] || v;
      });

      this._stringConfigEntries((k) => {
        if (!this._sAggregateConfig[k]) return;
        const v = p[k];
        if (v) strSums[k].add(v);
      });
    }
    for (const [k, [avg, sum]] of Object.entries(this._nAggregateConfig)) {
      const m = mode === "random" ? avg : sum;

      if (m === "avg") {
        sums[k] /= projectiles.length;
      } else if (typeof m === "function") {
        sums[k] = m(projectiles);
      }
    }

    // ---------- build result ----------
    const final: Partial<TResolvedProjectile> = {
      additionalDamage: this._aggregateAdditionalDamage(projectiles, mode, sums),
    };

    this._stringConfigEntries((k) => {
      const v = Array.from(strSums[k]).join(",");
      if (v) final[k] = v;
    });
    this._numericConfigEntries((k) => {
      if (sums[k]) final[k] = sums[k];
    });
    this._booleanConfigEntries((k) => {
      if (hasTrue[k]) final[k] = hasTrue[k];
    });

    return final as TResolvedProjectile;
  }
}
