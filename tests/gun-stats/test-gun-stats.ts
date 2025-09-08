import { describe, expect, it } from "vitest";
import keyBy from "lodash/keyBy";
import cloneDeep from "lodash/cloneDeep";
import { TResolvedProjectileMode, TResolvedProjectileModule } from "../../src/client/service/game-object.service";
import { GunStats } from "../../src/client/service/gun.service";
import { GunService, TGunStats } from "../../src/client/service/gun.service";
import { GameObjectService } from "../../src/client/service/game-object.service";
import { hashObject, JSONstringifyOrder, sanitizeTestData } from "../helpers";
import type { TGun } from "../../src/client/generated/models/gun.model";

function stripUnusedFields(gunStats: TGunStats) {
  for (const module of gunStats.mode.volley) {
    for (const projectile of module.projectiles) {
      delete projectile.animation;
      delete projectile.gunId;
    }
  }

  return gunStats;
}

const gunLookup = keyBy(GameObjectService.getGuns(), (g) => g.id);

export function getGun(id: number): TGun {
  return gunLookup[id];
}

function getGunStatsForTesting(gun: TGun, modeIndex: number, moduleIndex: number, projectileIndex: number) {
  const gunStats = GunService.computeGunStats(gun, modeIndex, moduleIndex, projectileIndex);

  return sanitizeTestData(stripUnusedFields(gunStats)) as TGunStats;
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

function toGunStatsSnapshot(gunStats: Omit<TGunStats, "mode">) {
  const cloned = cloneDeep(gunStats);

  cloned.damage.details = gunStats.damage.details.filter((d) => !d.tooltip.startsWith("Base"));
  cloned.dps.details = gunStats.dps.details.filter((d) => !d.tooltip.startsWith("Base"));
  cloned.force.details = gunStats.force.details.filter((d) => !d.tooltip.startsWith("Base"));

  return JSONstringifyOrder(cloned);
}

function toModesSnapshot(modes: TResolvedProjectileMode[]) {
  for (const mode of modes) {
    const moduleLookup = {} as Record<string, [m: TResolvedProjectileModule, count: number]>;
    for (const module of mode.volley) {
      const key = hashObject(module);
      if (!moduleLookup[key]) {
        moduleLookup[key] = [module, 0];
      }
      moduleLookup[key][1]++;
    }
    mode.volley = Object.values(moduleLookup).map(([p, moduleCount]) => ({
      ...p,
      moduleCount: moduleCount === 1 ? undefined : moduleCount,
    }));
  }
  return JSONstringifyOrder(modes);
}

export function testGunStats(gunId: number, gunName: string) {
  describe(`${gunName} (${gunId})`, () => {
    const gun = getGun(gunId);
    const modes: TResolvedProjectileMode[] = [];
    const statsLookup: Record<string, [Omit<TGunStats, "mode">, string[]]> = {};

    forEachGunStats(gun, (gunStats, i, j, k) => {
      const mLabel = j === -1 ? "A" : j;
      const pLabel = k === -1 ? "A" : k;
      const variantId = `${i}-${mLabel}-${pLabel}`;
      const { mode, ...stats } = gunStats;
      const key = hashObject(stats);

      if (!statsLookup[key]) {
        statsLookup[key] = [stats, []];
      }
      statsLookup[key][1].push(variantId);

      it(`TGunStats typecheck: ${variantId}`, () => {
        if (!modes[i]) {
          modes[i] = mode;
        } else {
          expect(mode).toEqual(modes[i]);
        }
        GunStats.parse(gunStats);
      });
    });

    const variantCountLookup: Record<number, number> = {};
    for (const [, variants] of Object.values(statsLookup)) {
      for (const variant of variants) {
        const [i] = variant.split("-");
        variantCountLookup[i] = (variantCountLookup[i] || 0) + 1;
      }
    }
    for (const [, variants] of Object.values(statsLookup)) {
      const [i] = variants[0].split("-");
      if (variantCountLookup[i] === 2 && variants.length !== 2) {
        throw new Error(
          `If there are only 2 stats: 1 aggregated and 1 single module, they must be structurally the same but [mode=${i}] got ${variants.length}: ${variants.join(",")}.`,
        );
      }
    }

    for (const [stats, variantIds] of Object.values(statsLookup)) {
      const variant = `[variants=${variantIds.join(",")}]`;

      it(variant, () => {
        expect(toGunStatsSnapshot(stats)).toMatchSnapshot();
      });
    }

    // modes[i] is always the same in all combination of module/projectile selections.
    // Just test once here to reduce the snapshot size.
    it(`modes`, () => {
      expect(toModesSnapshot(modes)).toMatchSnapshot();
    });
  });
}
