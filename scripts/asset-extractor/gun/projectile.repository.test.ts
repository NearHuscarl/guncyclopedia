import { beforeAll, describe, expect, it, vi } from "vitest";
import path from "node:path";
import { readFile } from "node:fs/promises";
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

  const fixturePath = path.join(import.meta.dirname, "__fixtures__");

  async function createProjectileRepo(inputPath: string) {
    const assetService = await AssetService.create(fixturePath);
    const projRepo = await ProjectileRepository.create(assetService, [inputPath]);
    return projRepo;
  }

  it("should parse simple projectile from refab file", async () => {
    const inputPath = path.join(fixturePath, "simple-projectile");
    const projRepo = await createProjectileRepo(inputPath);
    const actual = projRepo.getProjectile({ $$scriptPath: "Excaliber_Green_Projectile.prefab.meta" });
    const outputPath = path.join(fixturePath, "simple-projectile/Excaliber_Green_Projectile.prefab.json");
    const expected = JSON.parse(await readFile(outputPath, "utf-8"));

    expect(actual).toEqual(expected);
  });
});
