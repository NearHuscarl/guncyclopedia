import { GunService, TGunStats } from "../../src/client/service/gun.service";
import type { TGun } from "../../src/client/generated/models/gun.model";

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
  return stripAnimations(gunStats);
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
