import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import z from "zod/v4";
import { ASSET_EXTRACTOR_ROOT } from "../constants.ts";
import { AssetService } from "../asset/asset-service.ts";
import { GunDto } from "./gun.dto.ts";
import { restoreCache, saveCache } from "../utils/cache.ts";
import { performance } from "node:perf_hooks";
import type { TGunData, TGunDto, TPredatorGunControllerData } from "./gun.dto.ts";

export class GunRepository {
  private static readonly _GUN_DIRECTORIES = [
    "assets/ExportedProject/Assets/data/guns",
    "assets/ExportedProject/Assets/GameObject",
  ];

  private _guns = new Map<number, TGunDto>();
  private readonly _assetService: AssetService;
  private readonly _gunDirectories: string[];

  private constructor(assetService: AssetService, gunDirectories?: string[]) {
    this._assetService = assetService;
    this._gunDirectories = gunDirectories || GunRepository._GUN_DIRECTORIES;
  }

  static async create(_assetService: AssetService, gunDirectories?: string[]) {
    const instance = new GunRepository(_assetService, gunDirectories);
    return await instance.load();
  }

  async load() {
    return await this._loadGunData();
  }

  private _isGunData(obj: unknown): obj is TGunData {
    return this._assetService.isMonoBehaviour(obj) && obj.m_Script.$$scriptPath.endsWith(AssetService.GUN_SCRIPT);
  }
  private _isPredatorGunControllerData(obj: unknown): obj is TPredatorGunControllerData {
    return (
      this._assetService.isMonoBehaviour(obj) && obj.m_Script.$$scriptPath.endsWith("PredatorGunController.cs.meta")
    );
  }

  private async _getAllRefabFilesInGunFolders() {
    const res: string[] = [];

    for (const dir of this._gunDirectories) {
      const files = await readdir(path.join(ASSET_EXTRACTOR_ROOT, dir));

      for (const file of files) {
        if (!file.endsWith(".prefab")) continue;
        const content = await readFile(path.join(ASSET_EXTRACTOR_ROOT, dir, file), "utf-8");
        if (!content.includes("gunName")) continue; // quick check to filter out non-gun prefabs

        res.push(path.join(dir, file));
      }
    }

    return res;
  }

  private async _parseGun(filePath: string) {
    const refab = await this._assetService.parseSerializedAsset(filePath);
    const res: Partial<TGunDto> = {};

    try {
      for (const block of refab) {
        if (this._isGunData(block)) {
          res.gun = block;
        } else if (this._isPredatorGunControllerData(block)) {
          res.predatorGunController = block;
        }
      }

      return GunDto.parse(res);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(chalk.red(`Error parsing gun dto, ID: ${res.gun?.PickupObjectId}, name: ${res.gun?.gunName}`));
        console.error(z.prettifyError(error));
        process.exit(1);
      } else {
        throw error;
      }
    }
  }

  private async _loadGunData() {
    console.log(chalk.green("Loading gun data..."));

    this._guns = await restoreCache("gun.repository", Number);

    if (this._guns.size > 0) {
      console.log(chalk.green(`Loaded ${chalk.yellow(this._guns.size)} guns from cache.`));
      return this;
    }
    console.log(chalk.yellow("No cache found, loading guns from files..."));

    const prefabFiles = await this._getAllRefabFilesInGunFolders();
    const start = performance.now();

    for (let i = 0; i < prefabFiles.length; i++) {
      const file = prefabFiles[i];
      process.stdout.write(chalk.grey(`\rloading guns from ${i + 1}/${prefabFiles.length} files...`));
      const gunDto = await this._parseGun(file);
      if (!gunDto) continue;

      this._guns.set(gunDto.gun.PickupObjectId, gunDto);
    }

    console.log();
    console.log(chalk.magenta(`Took ${(performance.now() - start) / 1000}s`));

    await saveCache("gun.repository", this._guns);
    return this;
  }

  getGun(pickupObjectId: number) {
    return this._guns.get(pickupObjectId);
  }
}
