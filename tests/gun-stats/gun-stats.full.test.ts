import { describe } from "vitest";
import { GameObjectService } from "../../src/client/service/game-object.service";
import { testGunStats } from "./test-gun-stats";

describe("Gun", () => {
  const guns = GameObjectService.getGuns();

  for (const gun of guns) {
    testGunStats(gun.id, gun.name);
  }
});
