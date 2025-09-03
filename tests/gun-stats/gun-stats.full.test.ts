import { describe, expect, it } from "vitest";
import { GameObjectService } from "../../src/client/service/game-object.service";
import { forEachGunStats, JSONstringifyOrder } from "./helpers";

describe("Gun stats: regression", () => {
  const guns = GameObjectService.getGuns();

  for (const gun of guns) {
    forEachGunStats(gun, (gunStats, i, j, k) => {
      const variantId = `${gunStats.mode.mode}-${j === -1 ? "A" : j}-${k === -1 ? "A" : k}`;
      it(`should match snapshot of ${gun.name} (${gun.id}) - ${variantId}`, () => {
        expect(JSONstringifyOrder(gunStats)).toMatchSnapshot();
      });
    });
  }
});
