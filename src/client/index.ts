import memoize from "lodash/memoize";
import pickupObjects from "./generated/data/pickup-objects.json";
import { isGun } from "./generated/helpers/types";
import type { TGun, TProjectile } from "./generated/models/gun.model";
import type { TPickupObject } from "./generated/models/pickup-object.model";

export const getPickupObjects = (): TPickupObject[] => {
  return pickupObjects as TPickupObject[];
};

export const getGuns = memoize((): TGun[] => {
  return getPickupObjects().filter(isGun);
});

type AggregateModeOption = "sum" | "avg";
type AggregateMode = "sum" | "avg" | "max";

/**
 * Compute an 'average' projectile from a list.
 *
 * - Numeric & percentage fields are averaged; missing values are `0`
 *   (`spawnWeight` is always `1` as there is only one projectile).
 * - Boolean fields default to `false`; the result is `true` if any
 *   projectile has `true`. E.g. if this gun has homing projectiles,
 *
 * @throws {Error} if the input array is empty.
 */
export function createAggregatedProjectileData(projectiles: TProjectile[], mode: AggregateModeOption): TProjectile {
  if (projectiles.length === 0) {
    throw new Error("Cannot average an empty projectile list.");
  }

  // All numeric (and percentage) keys that should be averaged.
  const numericKeys = [
    ["damage", "avg", "sum"],
    ["speed", "avg", "avg"],
    ["range", "avg", "max"],
    ["force", "avg", "sum"],
    ["spawnWeight"],
    ["poisonChance", "avg", "max"],
    ["speedChance", "avg", "max"],
    ["charmChance", "avg", "max"],
    ["freezeChance", "avg", "max"],
    ["fireChance", "avg", "max"],
    ["stunChance", "avg", "max"],
    ["cheeseChance", "avg", "max"],
    ["numberOfBounces", "avg", "avg"],
    ["chanceToDieOnBounce", "avg", "avg"],
    ["penetration", "avg", "max"],
    ["homingRadius", "avg", "avg"],
    ["homingAngularVelocity", "avg", "avg"],
    ["beamChargeTime", "max", "max"],
    ["beamStatusEffectChancePerSecond", "max", "max"],
    // TODO: add "dps" once you’ve decided to include it
  ] as const satisfies [keyof TProjectile, avg?: AggregateMode, sum?: AggregateMode][];

  // All boolean keys that are aggregated with logical‐AND.
  const booleanKeys = [
    "ignoreDamageCaps",
    "canPenetrateObjects",
    "isHoming",
    "homingAnddamageAllEnemies",
  ] as const satisfies (keyof TProjectile)[];

  // ---------- aggregate ----------
  const sums: Record<string, number> = {};
  numericKeys.forEach(([k]) => (sums[k] = 0));

  const hasTrue: Record<string, boolean> = {};
  booleanKeys.forEach(([k]) => (hasTrue[k] = true));

  for (const p of projectiles) {
    for (const [k, avg, sum] of numericKeys) {
      const m = mode === "avg" ? avg : sum;

      if (m === "max") {
        sums[k] = Math.max(sums[k], p[k] ?? 0);
      } else if (m === "avg" || m === "sum") {
        sums[k] += p[k] ?? 0;
      }
    }

    booleanKeys.forEach((k) => {
      const v = p[k] ?? true; // default to true
      hasTrue[k] = hasTrue[k] || v;
    });
  }
  for (const [k, avg, sum] of numericKeys) {
    const m = mode === "avg" ? avg : sum;

    if (m === "avg") {
      sums[k] /= projectiles.length;
    }
  }

  // ---------- build result ----------
  const final: Partial<TProjectile> = { id: "average", spawnWeight: 1 };

  numericKeys.forEach(([k]) => (final[k] = sums[k]));
  booleanKeys.forEach((k) => (final[k] = hasTrue[k]));

  return final as TProjectile;
}

export function getGunStats() {
  const guns = getGuns();
  let maxReloadTime = 0;
  let maxMagazineSize = 0;
  let maxChargeTime = 0;
  let maxCooldownTime = 0;
  let maxSpread = 0;

  for (const gun of guns) {
    maxReloadTime = Math.max(maxReloadTime, gun.reloadTime);

    for (const mode of gun.projectileModes) {
      if (mode.magazineSize !== gun.maxAmmo) {
        maxMagazineSize = Math.max(maxMagazineSize, mode.magazineSize);
      }
      if (mode.chargeTime !== undefined) {
        maxChargeTime = Math.max(maxChargeTime, mode.chargeTime);
      }
      for (const projectile of mode.projectiles) {
        maxCooldownTime = Math.max(maxCooldownTime, projectile.cooldownTime);

        if (gun.name !== "Crown of Guns") {
          maxSpread = Math.max(maxSpread, projectile.spread);
        }
      }
    }
  }

  return {
    guns,
    stats: {
      maxMaxAmmo: 1000,
      maxReloadTime,
      maxMagazineSize: Math.min(maxMagazineSize, 100),
      maxChargeTime,
      maxCooldownTime: Math.min(maxCooldownTime, 1),
      maxSpread: Math.min(maxSpread, 30),
    },
  };
}
