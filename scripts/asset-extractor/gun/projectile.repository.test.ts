import { beforeAll, describe, expect, it, vi } from "vitest";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { ASSET_EXTRACTOR_ROOT } from "../constants.ts";
import { AssetService } from "../asset/asset-service.ts";
import { ProjectileRepository } from "./projectile.repository.ts";

describe("projectile.repository.ts", () => {
  beforeAll(() => {
    vi.mock("../utils/cache", async () => {
      return {
        ...(await vi.importActual("../utils/cache")),
        saveCache: vi.fn(),
      };
    });
  });

  async function createProjectileRepo(inputPath: string) {
    const assetService = await AssetService.create(path.join(import.meta.dirname, "__fixtures__"));
    const projRepo = await ProjectileRepository.create(assetService, [inputPath]);
    return projRepo;
  }

  it("should parse simple projectile from refab file", async () => {
    const inputPath = "gun/__fixtures__/simple-projectile";
    const projRepo = await createProjectileRepo(inputPath);
    const actual = projRepo.getProjectile({ $$scriptPath: "Excaliber_Green_Projectile.prefab.meta" });
    const outputPath = "gun/__fixtures__/simple-projectile/Excaliber_Green_Projectile.prefab.json";
    const expected = JSON.parse(await readFile(path.join(ASSET_EXTRACTOR_ROOT, outputPath), "utf-8"));

    expect(actual).toEqual(expected);
  });
});
