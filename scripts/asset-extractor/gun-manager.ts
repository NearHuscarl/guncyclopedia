import { access, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import z from "zod/v4";
import constants from "node:constants";

export const GunDto = {
  ItemQuality: {
    EXCLUDED: -100,
    SPECIAL: -50,
    COMMON: 0,
    D: 1,
    C: 2,
    B: 3,
    A: 4,
    S: 5,
  },
  GunClass: {
    NONE: 0,
    PISTOL: 1,
    SHOTGUN: 5,
    FULLAUTO: 10,
    RIFLE: 15,
    BEAM: 20,
    POISON: 25,
    FIRE: 30,
    ICE: 35,
    CHARM: 40,
    EXPLOSIVE: 45,
    SILLY: 50,
    SHITTY: 55,
    CHARGE: 60,
  },
  ShootStyle: {
    SemiAutomatic: 0,
    Automatic: 1,
    Beam: 2,
    Charged: 3,
    Burst: 4,
  },
};

type TGunDto = z.input<typeof GunManager.GunDto>;

export class GunManager {
  private static _guns: Record<number, TGunDto> = {};
  private static _cacheFilePath = path.join(import.meta.dirname, "out/gun-manager.cache.json");

  static GunDto = z.object({
    PickupObjectId: z.number(),
    gunName: z.string(),
    quality: z.enum(GunDto.ItemQuality),
    gunClass: z.number(),
    maxAmmo: z.number(),
    reloadTime: z.number(),
    singleModule: z.object({
      shootStyle: z.number(),
      cooldownTime: z.number(),
      angleVariance: z.number(),
      numberOfShotsInClip: z.number(),
    }),
  });

  static isGunDto(obj: unknown): obj is TGunDto {
    return obj instanceof Object && "gunName" in obj;
  }

  static async restoreCache() {
    try {
      await access(this._cacheFilePath, constants.F_OK);
      const text = await readFile(this._cacheFilePath, { encoding: "utf-8" });
      return JSON.parse(text) as Record<number, TGunDto>;
    } catch {
      // file doesn't exist or unreadable
      return {};
    }
  }

  static async saveCache() {
    await writeFile(this._cacheFilePath, JSON.stringify(this._guns, null, 2), {
      encoding: "utf-8",
    });
  }

  static async load() {
    console.log(chalk.green("Loading gun data..."));

    this._guns = await this.restoreCache();

    if (Object.keys(this._guns).length > 0) {
      console.log(chalk.green(`Loaded ${Object.keys(this._guns).length} guns from cache.`));
      return;
    }
    console.log(chalk.yellow("No cache found, loading guns from files..."));

    const folderPath = path.join(import.meta.dirname, "assets/MonoBehaviour");
    const files = await readdir(folderPath);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    for (const file of jsonFiles) {
      const text = await readFile(path.join(folderPath, file), {
        encoding: "utf-8",
      });
      const json = JSON.parse(text);
      if (!this.isGunDto(json)) continue;

      try {
        const gunDto = this.GunDto.parse(json);
        this._guns[gunDto.PickupObjectId] = gunDto;
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error(chalk.red(`Error parsing gun dto, ID: ${json.PickupObjectId}, name: ${json.gunName}`));
          console.error(z.flattenError(error));
        }
        throw error;
      }
    }

    await this.saveCache();
  }

  static getGun(pickupObjectId: number) {
    return this._guns[pickupObjectId];
  }
}
