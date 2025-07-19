import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import z from "zod/v4";
import { ASSET_EXTRACTOR_ROOT } from "../constants.ts";
import { AssetService } from "../asset-service.ts";
import { GunDto } from "./gun.dto.ts";
import type { TGunDto } from "./gun.dto.ts";
import { restoreCache, saveCache } from "../utils/cache.ts";
import { performance } from "node:perf_hooks";

export class GunRepository {
  private static _guns = new Map<number, TGunDto>();

  static isGunDto(obj: unknown): obj is TGunDto {
    return obj instanceof Object && "gunName" in obj;
  }

  private static async _getAllRefabFilesInGunFolders() {
    const gunDirectories = ["assets/ExportedProject/Assets/data/guns", "assets/ExportedProject/Assets/GameObject"];
    const res: string[] = [];

    for (const dir of gunDirectories) {
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

  private static async _parseGun(filePath: string) {
    try {
      const refab = await AssetService.parseSerializedAsset(filePath);
      for (const block of refab) {
        if (!this.isGunDto(block)) {
          continue;
        }

        try {
          return GunDto.parse(block);
        } catch (error) {
          if (error instanceof z.ZodError) {
            console.error(chalk.red(`Error parsing gun dto, ID: ${block.PickupObjectId}, name: ${block.gunName}`));
            console.error(z.prettifyError(error));
          }
          throw error;
        }
      }
    } catch {
      console.warn(chalk.yellow(`Error parsing ${filePath}. Skipping...`));
    }
  }

  static async load() {
    console.log(chalk.green("Loading gun data..."));

    this._guns = await restoreCache("gun.repository", Number);

    if (this._guns.size > 0) {
      console.log(chalk.green(`Loaded ${chalk.yellow(this._guns.size)} guns from cache.`));
      return;
    }
    console.log(chalk.yellow("No cache found, loading guns from files..."));

    const prefabFiles = await this._getAllRefabFilesInGunFolders();
    const start = performance.now();

    for (let i = 0; i < prefabFiles.length; i++) {
      const file = prefabFiles[i];
      process.stdout.write(chalk.grey(`\rloading guns from ${i + 1}/${prefabFiles.length} files...`));
      const gunDto = await this._parseGun(file);
      if (!gunDto) continue;

      this._guns.set(gunDto.PickupObjectId, gunDto);
    }

    console.log();
    console.log(chalk.magenta(`Took ${(performance.now() - start) / 1000}s`));

    await saveCache("gun.repository", this._guns);
  }

  static getGun(pickupObjectId: number) {
    return this._guns.get(pickupObjectId);
  }
}
