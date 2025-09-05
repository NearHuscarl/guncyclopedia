import { GunService, TGunStats } from "../../src/client/service/gun.service";
import type { TGun } from "../../src/client/generated/models/gun.model";

function roundNumbersDeep(obj: unknown, digits = 3): unknown {
  if (typeof obj === "number") {
    return Number(obj.toFixed(digits));
  }
  if (Array.isArray(obj)) {
    return obj.map((v) => roundNumbersDeep(v, digits));
  }
  if (obj && typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = roundNumbersDeep(v, digits);
    }
    return out;
  }
  return obj;
}

export function JSONstringifyOrder(obj: object, space = 2) {
  const allKeys = new Set<string>();
  JSON.stringify(obj, (key, value) => (allKeys.add(key), value));
  return JSON.stringify(obj, Array.from(allKeys).sort(), space);
}

function stripAnimations(gunStats: TGunStats) {
  for (const module of gunStats.mode.volley) {
    for (const projectile of module.projectiles) {
      delete projectile.animation;
    }
  }
  return gunStats;
}

function getGunStatsForTesting(gun: TGun, modeIndex: number, moduleIndex: number, projectileIndex: number) {
  const gunStats = GunService.computeGunStats(gun, modeIndex, moduleIndex, projectileIndex);
  return roundNumbersDeep(stripAnimations(gunStats)) as TGunStats;
}

type TForEachGunStatsCallback = (
  gunStats: TGunStats,
  modeIndex: number,
  moduleIndex: number,
  projectileIndex: number,
) => void;

export function forEachGunStats(gun: TGun, callback: TForEachGunStatsCallback) {
  for (let i = 0; i < gun.projectileModes.length; i++) {
    const fullyAggregatedGunStats = getGunStatsForTesting(gun, i, -1, -1);
    callback(fullyAggregatedGunStats, i, -1, -1);

    for (let j = 0; j < fullyAggregatedGunStats.mode.volley.length; j++) {
      for (let k = 0; k < fullyAggregatedGunStats.mode.volley[j].projectiles.length; k++) {
        const gunStats = getGunStatsForTesting(gun, i, j, k);
        callback(gunStats, i, j, k);
      }
    }
  }
}
