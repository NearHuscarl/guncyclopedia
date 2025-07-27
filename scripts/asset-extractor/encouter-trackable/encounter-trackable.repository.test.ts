import { beforeAll, describe, expect, it, vi } from "vitest";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { EncounterTrackableRepository } from "./encounter-trackable.repository.ts";
import { AssetService } from "../asset/asset-service.ts";

describe("encounter-trackable.repository.ts", () => {
  beforeAll(() => {
    vi.spyOn(AssetService.prototype, "load").mockImplementation(function () {
      return this;
    });
  });

  async function createEncounterTrackableRepo(dbPath: string) {
    const assetService = await AssetService.create();
    return EncounterTrackableRepository.create(assetService, dbPath);
  }

  it("should parse EncounterDatabase.asset and expose entries", async () => {
    const inputPath = path.join(import.meta.dirname, "__fixtures__/encounter-db.asset");
    const encounterRepo = await createEncounterTrackableRepo(inputPath);
    const actual = encounterRepo.entries;
    const outputPath = path.join(import.meta.dirname, "__fixtures__/encounter-db.asset.json");
    const expected = JSON.parse(await readFile(outputPath, "utf-8"));

    expect(actual).toEqual(expected);
  });
});
