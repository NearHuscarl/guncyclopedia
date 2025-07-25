import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import z from "zod/v4";
import { ASSET_EXTRACTOR_ROOT } from "../constants.ts";
import { AssetService } from "../asset/asset-service.ts";
import { restoreCache, saveCache } from "../utils/cache.ts";
import { ProjectileDto } from "./projectile.dto.ts";
import type { TProjectileDto } from "./projectile.dto.ts";

type Guid = string;

export class ProjectileRepository {
  private static readonly _SEARCH_DIRECTORIES = [
    "assets/ExportedProject/Assets/GameObject",
    "assets/ExportedProject/Assets/data/projectiles",
    "assets/ExportedProject/Assets/data/projectiles/beams",
  ];

  private _projectiles = new Map<Guid, TProjectileDto>();
  private readonly _assetService: AssetService;
  private readonly _searchDirectories: string[];

  private constructor(assetService: AssetService, searchDirectories?: string[]) {
    this._assetService = assetService;
    this._searchDirectories = searchDirectories || ProjectileRepository._SEARCH_DIRECTORIES;
  }

  static async create(_assetService: AssetService, searchDirectories?: string[]) {
    const instance = new ProjectileRepository(_assetService, searchDirectories);
    return await instance.load();
  }

  private _isProjectileDto(obj: unknown): obj is TProjectileDto {
    return (
      this._assetService.isMonoBehaviour(obj) && obj.m_Script.$$scriptPath.endsWith(AssetService.PROJECTILE_SCRIPT)
    );
  }

  private async _getAllProjectileRefabFiles() {
    const res: string[] = [];

    for (const dir of this._searchDirectories) {
      const files = await readdir(path.join(ASSET_EXTRACTOR_ROOT, dir));

      for (const file of files) {
        if (!file.endsWith(".prefab")) continue;
        const content = await readFile(path.join(ASSET_EXTRACTOR_ROOT, dir, file), "utf-8");
        if (!content.includes("AppliesPoison")) continue; // quick check to filter out non-projectile prefabs

        res.push(path.join(dir, file));
      }
    }

    return res;
  }

  private async _parseProjectile(filePath: string) {
    const refab = await this._assetService.parseSerializedAsset(filePath);
    let $$name = "";
    for (const block of refab) {
      if (typeof block.m_Name === "string" && block.m_Name !== "Sprite") {
        $$name = block.m_Name;
      }
      if (!this._isProjectileDto(block)) {
        continue;
      }

      try {
        const metaFilePath = filePath + ".meta";
        const $$id = this._getProjectileKey({ $$scriptPath: metaFilePath });

        return ProjectileDto.parse({ ...block, $$id, $$name });
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error(chalk.red(`Error parsing projectile dto at ${filePath}`));
          console.error(chalk.red(z.prettifyError(error)));
        } else {
          throw error;
        }
      }
    }
  }

  async load() {
    console.log(chalk.green("Loading projectile data..."));

    this._projectiles = await restoreCache("projectile.repository");

    if (this._projectiles.size > 0) {
      console.log(chalk.green(`Loaded ${chalk.yellow(this._projectiles.size)} projectiles from cache.`));
      return this;
    }
    console.log(chalk.yellow("No cache found, loading projectiles from files..."));

    const prefabFiles = await this._getAllProjectileRefabFiles();
    const start = performance.now();

    for (let i = 0; i < prefabFiles.length; i++) {
      const file = prefabFiles[i];
      process.stdout.write(chalk.grey(`\rloading projectiles from ${i + 1}/${prefabFiles.length} files...`));
      const projDto = await this._parseProjectile(file);
      if (!projDto) continue;

      this._projectiles.set(projDto.$$id, projDto);
    }

    console.log();
    console.log(chalk.magenta(`Took ${(performance.now() - start) / 1000}s`));

    await saveCache("projectile.repository", this._projectiles);
    return this;
  }

  private _getProjectileKey(assetReference: { $$scriptPath: string }) {
    return path.basename(assetReference.$$scriptPath, ".prefab.meta").replaceAll(" ", "_");
  }

  getProjectile(assetReference: { $$scriptPath: string }): TProjectileDto | undefined {
    return this._projectiles.get(this._getProjectileKey(assetReference));
  }
}
