import { describe } from "vitest";
import { GameObjectService } from "../../src/client/service/game-object.service";
import { runTest } from "./helpers";

describe("Gun", () => {
  const guns = GameObjectService.getGuns();

  for (const gun of guns) {
    // Issue with damage/dps is undefined. TODO
    if (gun.id === 515 || gun.id === 368) {
      continue;
    }
    runTest(gun.id, gun.name);
  }
});
