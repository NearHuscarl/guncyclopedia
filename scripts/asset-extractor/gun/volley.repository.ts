import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import z from "zod/v4";
import { ASSET_EXTRACTOR_ROOT } from "../constants.ts";
import { AssetService } from "../asset/asset-service.ts";
import { restoreCache, saveCache } from "../utils/cache.ts";
import { VolleyDto } from "./volley.dto.ts";
import type { TVolleyDto } from "./volley.dto.ts";
import type { TAssetExternalReference } from "../utils/schema.ts";

type Guid = string;

export class VolleyRepository {
  private static readonly _SEARCH_DIRECTORIES = [
    "assets/ExportedProject/Assets/MonoBehaviour",
    "assets/ExportedProject/Assets/data/gunvolleys",
  ].map((dir) => path.join(ASSET_EXTRACTOR_ROOT, dir));

  private _volleys = new Map<Guid, TVolleyDto>();
  private readonly _assetService: AssetService;
  private readonly _searchDirectories: string[];

  private constructor(assetService: AssetService, searchDirectories?: string[]) {
    this._assetService = assetService;
    this._searchDirectories = searchDirectories || VolleyRepository._SEARCH_DIRECTORIES;
  }

  static async create(_assetService: AssetService, searchDirectories?: string[]) {
    const instance = new VolleyRepository(_assetService, searchDirectories);
    return await instance.load();
  }

  private _isVolleyDto(obj: unknown): obj is TVolleyDto {
    return (
      this._assetService.isMonoBehaviour(obj) &&
      obj.m_Script.$$scriptPath.endsWith(AssetService.PROJECTILE_VOLLEY_SCRIPT)
    );
  }

  private async _getAllVolleyRefabFiles() {
    const res: string[] = [];

    for (const dir of this._searchDirectories) {
      const files = await readdir(dir);

      for (const file of files) {
        if (!file.endsWith(".asset")) continue;
        const content = await readFile(path.join(dir, file), "utf-8");
        if (!content.includes("UsesBeamRotationLimiter")) continue; // quick check to filter out non-volley prefabs

        res.push(path.join(dir, file));
      }
    }

    return res;
  }

  private async _parseVolley(filePath: string) {
    const refab = await this._assetService.parseSerializedAsset(filePath);

    try {
      for (const component of refab) {
        if (!this._isVolleyDto(component)) {
          continue;
        }

        const metaFilePath = filePath + ".meta";
        const $$id = this._getVolleyKey({ $$scriptPath: metaFilePath });
        return VolleyDto.parse({ ...component, $$id });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(chalk.red(`Error parsing volley dto at ${filePath}`));
        console.error(z.prettifyError(error));
      }
      throw error;
    }
  }

  async load() {
    console.log(chalk.green("Loading volley data..."));

    this._volleys = await restoreCache("volley.repository");

    if (this._volleys.size > 0) {
      console.log(chalk.green(`Loaded ${chalk.yellow(this._volleys.size)} volleys from cache.`));
      return this;
    }
    console.log(chalk.yellow("No cache found, loading volleys from files..."));

    const prefabFiles = await this._getAllVolleyRefabFiles();
    const start = performance.now();

    for (let i = 0; i < prefabFiles.length; i++) {
      const file = prefabFiles[i];
      process.stdout.write(chalk.grey(`\rloading volleys from ${i + 1}/${prefabFiles.length} files...`));
      const volleyDto = await this._parseVolley(file);
      if (!volleyDto) continue;

      this._volleys.set(volleyDto.$$id, volleyDto);
    }

    console.log();
    console.log(chalk.magenta(`Took ${(performance.now() - start) / 1000}s`));

    await saveCache("volley.repository", this._volleys);
    return this;
  }

  private _getVolleyKey(assetReference: { $$scriptPath: string }) {
    return path.basename(assetReference.$$scriptPath, ".asset.meta").replaceAll(" ", "_");
  }

  getVolley(assetReference: Required<TAssetExternalReference>) {
    return this._volleys.get(this._getVolleyKey(assetReference));
  }
}
