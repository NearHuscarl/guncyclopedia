import { beforeAll, describe, expect, it, vi } from "vitest";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { ASSET_EXTRACTOR_ROOT } from "../constants.ts";
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

  async function createGunRepo(inputPath: string) {
    const assetService = await AssetService.create(path.join(import.meta.dirname, "__fixtures__"));
    return GunRepository.create(assetService, [inputPath]);
  }

  it("should parse a simple gun from refab file", async () => {
    const inputPath = "gun/__fixtures__/simple-gun";
    const gunRepo = await createGunRepo(inputPath);
    const actual = gunRepo.getGun(345);
    const outputPath = "gun/__fixtures__/simple-gun/Excaliber_Green.prefab.json";
    const expected = JSON.parse(await readFile(path.join(ASSET_EXTRACTOR_ROOT, outputPath), "utf-8"));

    expect(actual).toEqual(expected);
  });

  it("should parse a charge gun from refab file", async () => {
    const inputPath = "gun/__fixtures__/charge-gun";
    const gunRepo = await createGunRepo(inputPath);
    const actual = gunRepo.getGun(41);
    const outputPath = "gun/__fixtures__/charge-gun/Samus Arm.prefab.json";
    const expected = JSON.parse(await readFile(path.join(ASSET_EXTRACTOR_ROOT, outputPath), "utf-8"));

    expect(actual).toEqual(expected);
  });
});
