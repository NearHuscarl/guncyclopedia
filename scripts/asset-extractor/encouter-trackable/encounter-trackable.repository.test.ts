import { beforeAll, describe, expect, it, vi } from "vitest";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { ASSET_EXTRACTOR_ROOT } from "../constants.ts";
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
    const inputPath = "encouter-trackable/__fixtures__/encounter-db.asset";
    const encounterRepo = await createEncounterTrackableRepo(inputPath);
    const actual = encounterRepo.entries;
    const outputPath = "encouter-trackable/__fixtures__/encounter-db.asset.json";
    const expected = JSON.parse(await readFile(path.join(ASSET_EXTRACTOR_ROOT, outputPath), "utf-8"));

    expect(actual).toEqual(expected);
  });
});
