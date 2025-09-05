import { describe, expect, it } from "vitest";
import { GameObjectService } from "../../src/client/service/game-object.service";
import { forEachGunStats, JSONstringifyOrder } from "./helpers";
import { GunStats } from "../../src/client/service/gun.service";

describe("Gun stats: regression", () => {
  const guns = GameObjectService.getGuns();

  for (const gun of guns) {
    // Issue with damage/dps is undefined. TODO
    if (gun.id === 515 || gun.id === 368) {
      continue;
    }
    forEachGunStats(gun, (gunStats, i, j, k) => {
      const variantId = `${gunStats.mode.mode}-${j === -1 ? "A" : j}-${k === -1 ? "A" : k}`;

      it(`should match snapshot of ${gun.name} (${gun.id}) - ${variantId}`, () => {
        // expect(() => GunStats.parse(gunStats)).not.toThrow();
        expect(JSONstringifyOrder(gunStats)).toMatchSnapshot();
      });
    });
  }
});
