import path from "node:path";
import chalk from "chalk";
import z from "zod/v4";
import sumBy from "lodash/sumBy.js";
import { SpriteCollectionDto } from "./sprite.dto.ts";
import { AssetService } from "../asset/asset-service.ts";
import { restoreCache, saveCache } from "../utils/cache.ts";
import { ASSET_EXTRACTOR_ROOT } from "../constants.ts";
import type { TSpriteCollectionDto } from "./sprite.dto.ts";
import type { TMaterial } from "../asset/asset.dto.ts";
import { normalizePath } from "../utils/path.ts";
import { fileExists } from "../utils/fs.ts";

type TCollectionPath = string;

export class SpriteRepository {
  static readonly AMMONONICON_SPRITE_PATH = path.join(
    ASSET_EXTRACTOR_ROOT,
    "assets/ExportedProject/Assets/GameObject/Ammonomicon Encounter Icon Collection.prefab",
  );
  private static readonly _SEARCH_FILES = [
    // guns
    "assets/ExportedProject/Assets/sprites/weapons/weaponcollection02 data/WeaponCollection02.prefab",
    "assets/ExportedProject/Assets/sprites/weapons/weaponcollection data/WeaponCollection.prefab",
    "assets/ExportedProject/Assets/sprites/weapons/weaponbeamcollection data/WeaponBeamCollection.prefab",
    "assets/ExportedProject/Assets/GameObject/WeaponCollection3.prefab",
    "assets/ExportedProject/Assets/GameObject/BeamWeaponCollection.prefab",
    "assets/ExportedProject/Assets/GameObject/Dolphin_WeaponCollection.prefab",
    "assets/ExportedProject/Assets/GameObject/Boss_West_Bros_Collection.prefab",
    // projectiles
    "assets/ExportedProject/Assets/sprites/projectiles/projectilecollection data/ProjectileCollection.prefab",
    "assets/ExportedProject/Assets/sprites/projectiles/dolphin_projectiles/dolphin_projectiles data/Dolphin_Projectiles.prefab",
    "assets/ExportedProject/Assets/sprites/projectiles/projectile2collection data/Projectile2Collection.prefab",
    "assets/ExportedProject/Assets/sprites/vfx/vfx beam collection data/VFX Beam Collection.prefab",
    "assets/ExportedProject/Assets/sprites/vfx/vfx_item_collection data/VFX_Item_Collection.prefab",
    "assets/ExportedProject/Assets/sprites/vfx/vfx collection data/VFX Collection.prefab",
    "assets/ExportedProject/Assets/sprites/vfx/vfx collection 002 data/VFX Collection 002.prefab",
    "assets/ExportedProject/Assets/sprites/vfx/vfx_collection_003 data/VFX_Collection_003.prefab",
    "assets/ExportedProject/Assets/sprites/vfx/dolphin vfx/dolphin_vfx_collection_001 data/Dolphin_VFX_Collection_001.prefab",
    // minimap
    "assets/ExportedProject/Assets/sprites/ui/minimapcollection data/MinimapCollection.prefab",
  ]
    .map((p) => path.join(ASSET_EXTRACTOR_ROOT, p))
    .concat(SpriteRepository.AMMONONICON_SPRITE_PATH);

  private _sprites = new Map<TCollectionPath, TSpriteCollectionDto>();
  private _spriteLookup = new Map<TCollectionPath, Record<string, TSpriteCollectionDto["spriteDefinitions"][number]>>();
  private readonly _assetService: AssetService;
  private readonly _skipCache: boolean;

  readonly searchFiles: string[];

  private constructor(assetService: AssetService, searchFiles: string[], skipCache: boolean) {
    this._assetService = assetService;
    this._skipCache = skipCache;
    this.searchFiles = searchFiles;
  }

  static async create(_assetService: AssetService, searchFiles = SpriteRepository._SEARCH_FILES, skipCache = false) {
    const instance = new SpriteRepository(_assetService, searchFiles, skipCache);
    return await instance.load();
  }
  private _isSpriteCollectionData(obj: unknown): obj is TSpriteCollectionDto {
    return (
      this._assetService.isMonoBehaviour(obj) && obj.m_Script.$$scriptPath.endsWith("tk2dSpriteCollectionData.cs.meta")
    );
  }

  private async _parseSprite(filePath: string) {
    const refab = await this._assetService.parseSerializedAsset(filePath);

    try {
      for (const component of refab) {
        if (this._isSpriteCollectionData(component)) {
          for (const spriteData of component.spriteDefinitions) {
            const prefab2 = await this._assetService.parseSerializedAssetFromReference(spriteData.material);
            const material = prefab2[0] as TMaterial;
            let texturePath = "";

            if (!material?.m_SavedProperties.m_TexEnvs._MainTex.m_Texture.$$scriptPath) {
              // TODO: check if removing material lookup is possible.
              // throw new Error(`Missing texture path for sprite ${spriteData.name} in ${filePath}`);
              const dir = path.dirname(filePath);
              const textureNames = ["atlas0.png", "atlas0.png.bytes"];

              for (const textureName of textureNames) {
                if (await fileExists(path.join(dir, textureName))) {
                  texturePath = path.join(dir, textureName);
                  break;
                }
              }
            } else {
              texturePath = material.m_SavedProperties.m_TexEnvs._MainTex.m_Texture.$$scriptPath.replace(/\.meta$/, "");
            }

            if (!component.$$texturePath) {
              component.$$texturePath = texturePath;
            } else if (component.$$texturePath !== texturePath) {
              throw new Error(
                `Inconsistent texture paths for sprite collection in ${filePath}: ${component.$$texturePath} vs ${texturePath}`,
              );
            }
          }

          return SpriteCollectionDto.parse(component);
        }
      }
      throw new Error(`No sprite collection found in ${filePath}`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(chalk.red(`Error parsing sprite dto at ${filePath}`));
        console.error(chalk.red(z.prettifyError(error).slice(0, 300)));
        process.exit(1);
      } else {
        throw error;
      }
    }
  }

  private async _loadSpriteData() {
    console.log(chalk.green("Loading sprite data..."));

    if (!this._skipCache) this._sprites = await restoreCache("sprite.repository");

    if (this._sprites.size > 0) {
      const totalSprites = sumBy(Array.from(this._sprites.values()), (cur) => cur.spriteDefinitions.length);
      console.log(chalk.green(`Loaded ${chalk.yellow(totalSprites)} sprites from cache.`));
      return;
    }
    console.log(chalk.yellow("No cache found, loading sprites from files..."));

    const start = performance.now();

    for (let i = 0; i < this.searchFiles.length; i++) {
      const file = this.searchFiles[i];
      process.stdout.write(chalk.grey(`\rloading sprite collection from ${i + 1}/${this.searchFiles.length} files...`));
      const spriteDto = await this._parseSprite(file);
      this._sprites.set(normalizePath(file), spriteDto);
    }

    console.log();
    console.log(chalk.magenta(`Took ${(performance.now() - start) / 1000}s`));

    if (!this._skipCache) await saveCache("sprite.repository", this._sprites);
    return;
  }

  async load() {
    await this._loadSpriteData();
    for (const [path, spriteDto] of this._sprites.entries()) {
      this._spriteLookup.set(
        normalizePath(path),
        Object.fromEntries(spriteDto.spriteDefinitions.map((sprite) => [sprite.name, sprite])),
      );
    }
    return this;
  }

  getSprites(assetReference: { $$scriptPath: string }) {
    const scriptPath = assetReference.$$scriptPath.replace(/\.meta$/, "");
    const collection = this._sprites.get(normalizePath(scriptPath));

    if (!collection) {
      throw new Error(`Sprite collection not found for script path: ${chalk.green(scriptPath)}`);
    }

    return {
      spriteCollection: collection?.spriteDefinitions ?? [],
      texturePath: collection.$$texturePath,
    };
  }

  getSprite(assetReference: { $$scriptPath: string }, nameOrIndex: string | number) {
    const scriptPath = assetReference.$$scriptPath.replace(/\.meta$/, "");
    const collection = this._sprites.get(normalizePath(scriptPath));
    const spriteData =
      typeof nameOrIndex === "string"
        ? this._spriteLookup.get(normalizePath(scriptPath))?.[nameOrIndex]
        : collection?.spriteDefinitions[nameOrIndex];

    if (!collection) {
      throw new Error(`Sprite collection not found for script path: ${chalk.green(scriptPath)}`);
    }

    return {
      spriteData,
      texturePath: collection.$$texturePath,
    };
  }

  getSpriteTexturePath(scriptPath: string) {
    const texturePath = this._sprites.get(normalizePath(scriptPath.replace(/\.meta$/, "")))?.$$texturePath;
    if (!texturePath) {
      throw new Error(`Texture path not found for sprite collection: ${chalk.green(scriptPath)}`);
    }
    return texturePath;
  }
}
