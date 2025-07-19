import { readFile } from "node:fs/promises";
import path from "node:path";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { AssetService } from "./asset-service";
import { ASSET_EXTRACTOR_ROOT } from "../constants";

describe("asset-service.ts", () => {
  beforeAll(() => {
    vi.spyOn(AssetService.prototype, "load").mockImplementation(function () {
      return this;
    });
  });

  describe("parseSerializedAsset", () => {
    it("should parse Unity YAML blocks correctly", async () => {
      const assetService = await AssetService.create();

      vi.spyOn(assetService, "getPathByGuid").mockImplementation(() => "Assets/Scripts/Assembly-CSharp/Gun.cs.meta");

      const inputPath = "asset/__fixtures__/simple.prefab";
      const actual = await assetService.parseSerializedAsset(inputPath);
      const outputPath = "asset/__fixtures__/simple.prefab.json";
      const expected = JSON.parse(await readFile(path.join(ASSET_EXTRACTOR_ROOT, outputPath), "utf-8"));

      expect(actual).toEqual(expected);
    });

    it("should resolve $$scriptPath for any object with a guid", async () => {
      const assetService = await AssetService.create();
      const mockedAssetPaths = new Map<string, string>([
        ["0f903c73702fdea77bdc0ea60b3f9740", "Assets/Scripts/Assembly-CSharp/Gun.cs.meta"],
        ["7db03fb3e768b3b49bc458d390ac7ccb", "Assets/GameObject/Excaliber_Green_Projectile.prefab.meta"],
      ]);

      vi.spyOn(assetService, "getPathByGuid").mockImplementation((guid) => mockedAssetPaths.get(guid));

      const inputPath = "asset/__fixtures__/with-script.prefab";
      const actual = await assetService.parseSerializedAsset(inputPath);
      const outputPath = "asset/__fixtures__/with-script.prefab.json";
      const expected = JSON.parse(await readFile(path.join(ASSET_EXTRACTOR_ROOT, outputPath), "utf-8"));

      expect(actual).toEqual(expected);
    });
  });

  describe("parseAssetMeta", () => {
    it("should extract the guid from the meta file", async () => {
      const assetService = await AssetService.create();
      const inputPath = "asset/__fixtures__/simple.prefab.meta";
      const actual = await assetService.parseAssetMeta(path.join(ASSET_EXTRACTOR_ROOT, inputPath));
      const outputPath = "asset/__fixtures__/simple.prefab.meta.json";
      const expected = JSON.parse(await readFile(path.join(ASSET_EXTRACTOR_ROOT, outputPath), "utf-8"));

      expect(actual).toEqual(expected);
    });
  });
});
