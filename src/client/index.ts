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

/**
 * Compute an 'average' projectile from a list.
 *
 * - Numeric & percentage fields are averaged; missing values are `0`
 *   (`spawnWeight` is always `1` as there is only one projectile).
 * - Boolean fields default to `true`; the result is `true` only if every
 *   projectile has (or defaults to) `true`.
 *
 * @throws {Error} if the input array is empty.
 */
export function computeAverageProjectile(projectiles: [TProjectile, ...TProjectile[]]): TProjectile {
  if (projectiles.length === 0) {
    throw new Error("Cannot average an empty projectile list.");
  }

  // All numeric (and percentage) keys that should be averaged.
  const numericKeys = [
    "damage",
    "speed",
    "range",
    "force",
    "spawnWeight",
    "poisonChance",
    "speedChance",
    "charmChance",
    "freezeChance",
    "fireChance",
    "stunChance",
    "cheeseChance",
    "numberOfBounces",
    "chanceToDieOnBounce",
    "penetration",
    "homingRadius",
    "homingAngularVelocity",
    "beamChargeTime",
    "beamStatusEffectChancePerSecond",
    // TODO: add "dps" once you’ve decided to include it
  ] as const satisfies (keyof TProjectile)[];

  // All boolean keys that are aggregated with logical‐AND.
  const booleanKeys = [
    "ignoreDamageCaps",
    "canPenetrateObjects",
    "isHoming",
    "homingAnddamageAllEnemies",
  ] as const satisfies (keyof TProjectile)[];

  // ---------- accumulate ----------
  const sums: Record<string, number> = {};
  numericKeys.forEach((k) => (sums[k] = 0));

  const hasTrue: Record<string, boolean> = {};
  booleanKeys.forEach((k) => (hasTrue[k] = true));

  for (const p of projectiles) {
    numericKeys.forEach((k) => (sums[k] += p[k] ?? 0));

    booleanKeys.forEach((k) => {
      const v = p[k] ?? true; // default to true
      hasTrue[k] = hasTrue[k] || v;
    });
  }

  // ---------- build result ----------
  const avg: Partial<TProjectile> = { id: "average", spawnWeight: 1 };

  numericKeys.forEach((k) => (avg[k] = sums[k] / projectiles.length));
  booleanKeys.forEach((k) => (avg[k] = hasTrue[k]));

  return avg as TProjectile;
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
