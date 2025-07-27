import { beforeAll, describe, expect, it, vi } from "vitest";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { AssetService } from "../asset/asset-service.ts";
import { GunRepository } from "./gun.repository.ts";

describe("gun.repository.ts", () => {
  beforeAll(() => {
    vi.mock("../utils/cache", async () => {
      return {
        ...(await vi.importActual("../utils/cache")),
        saveCache: vi.fn(),
      };
    });
  });

  const fixturePath = path.join(import.meta.dirname, "__fixtures__");

  async function createGunRepo(inputPath: string) {
    const assetService = await AssetService.create(fixturePath);
    return GunRepository.create(assetService, [inputPath]);
  }

  it("should parse a simple gun from refab file", async () => {
    const inputPath = path.join(fixturePath, "simple-gun");
    const gunRepo = await createGunRepo(inputPath);
    const actual = gunRepo.getGun(345);
    const outputPath = path.join(fixturePath, "simple-gun/Excaliber_Green.prefab.json");
    const expected = JSON.parse(await readFile(outputPath, "utf-8"));

    expect(actual).toEqual(expected);
  });

  it("should parse a charge gun from refab file", async () => {
    const inputPath = path.join(fixturePath, "charge-gun");
    const gunRepo = await createGunRepo(inputPath);
    const actual = gunRepo.getGun(41);
    const outputPath = path.join(fixturePath, "charge-gun/Samus Arm.prefab.json");
    const expected = JSON.parse(await readFile(outputPath, "utf-8"));

    expect(actual).toEqual(expected);
  });
});
