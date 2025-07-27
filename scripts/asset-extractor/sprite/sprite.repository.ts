import path from "node:path";
import chalk from "chalk";
import z from "zod/v4";
import sumBy from "lodash/sumBy.js";
import { SpriteCollectionDto } from "./sprite.dto.ts";
import { AssetService } from "../asset/asset-service.ts";
import { restoreCache, saveCache } from "../utils/cache.ts";
import { ASSET_EXTRACTOR_ROOT } from "../constants.ts";
import type { TSpriteCollectionDto } from "./sprite.dto.ts";
import type { TMaterialBlock } from "../asset/asset.dto.ts";
import { normalizePath } from "../utils/path.ts";

type TCollectionPath = string;

export class SpriteRepository {
  static readonly AMMONONICON_SPRITE_PATH = path.join(
    ASSET_EXTRACTOR_ROOT,
    "assets/ExportedProject/Assets/GameObject/Ammonomicon Encounter Icon Collection.prefab"
  );
  private static readonly _SEARCH_FILES = [
    "assets/ExportedProject/Assets/sprites/weapons/weaponcollection02 data/WeaponCollection02.prefab",
    "assets/ExportedProject/Assets/sprites/weapons/weaponcollection data/WeaponCollection.prefab",
    "assets/ExportedProject/Assets/sprites/weapons/weaponbeamcollection data/WeaponBeamCollection.prefab",
    "assets/ExportedProject/Assets/GameObject/WeaponCollection3.prefab",
    "assets/ExportedProject/Assets/GameObject/BeamWeaponCollection.prefab",
    "assets/ExportedProject/Assets/GameObject/Dolphin_WeaponCollection.prefab",
    "assets/ExportedProject/Assets/GameObject/Boss_West_Bros_Collection.prefab",
  ]
    .map((p) => path.join(ASSET_EXTRACTOR_ROOT, p))
    .concat(SpriteRepository.AMMONONICON_SPRITE_PATH);

  private _sprites = new Map<TCollectionPath, TSpriteCollectionDto>();
  private _spriteLookup = new Map<TCollectionPath, Record<string, TSpriteCollectionDto["spriteDefinitions"][number]>>();
  private readonly _assetService: AssetService;

  readonly searchFiles: string[];

  private constructor(assetService: AssetService, searchFiles: string[]) {
    this._assetService = assetService;
    this.searchFiles = searchFiles;
  }

  static async create(_assetService: AssetService, searchFiles = SpriteRepository._SEARCH_FILES) {
    const instance = new SpriteRepository(_assetService, searchFiles);
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
      for (const block of refab) {
        if (this._isSpriteCollectionData(block)) {
          for (const spriteData of block.spriteDefinitions) {
            const blocks2 = await this._assetService.parseSerializedAssetFromReference(spriteData.material);
            const material = blocks2[0] as TMaterialBlock;
            if (!material?.m_SavedProperties.m_TexEnvs._MainTex.m_Texture.$$scriptPath) {
              throw new Error(`Missing texture path for sprite ${spriteData.name} in ${filePath}`);
            }

            const texturePath = material.m_SavedProperties.m_TexEnvs._MainTex.m_Texture.$$scriptPath.replace(
              /\.meta$/,
              ""
            );

            if (!block.$$texturePath) {
              block.$$texturePath = texturePath;
            } else if (block.$$texturePath !== texturePath) {
              throw new Error(
                `Inconsistent texture paths for sprite collection in ${filePath}: ${block.$$texturePath} vs ${texturePath}`
              );
            }
          }

          return SpriteCollectionDto.parse(block);
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

    this._sprites = await restoreCache("sprite.repository");

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

    await saveCache("sprite.repository", this._sprites);
    return;
  }

  async load() {
    await this._loadSpriteData();
    for (const [path, spriteDto] of this._sprites.entries()) {
      this._spriteLookup.set(
        normalizePath(path),
        Object.fromEntries(spriteDto.spriteDefinitions.map((sprite) => [sprite.name, sprite]))
      );
    }
    return this;
  }

  getSprite(assetReference: { $$scriptPath: string }, nameOrIndex: string | number) {
    const scriptPath = path.isAbsolute(assetReference.$$scriptPath)
      ? assetReference.$$scriptPath
      : path.join(ASSET_EXTRACTOR_ROOT, "assets/ExportedProject", assetReference.$$scriptPath.replace(/\.meta$/, ""));
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
      texturePath: path.join(ASSET_EXTRACTOR_ROOT, "assets/ExportedProject", collection.$$texturePath),
    };
  }

  getSpriteTexturePath(scriptPath: string) {
    const texturePath = this._sprites.get(normalizePath(scriptPath.replace(/\.meta$/, "")))?.$$texturePath;
    if (!texturePath) {
      throw new Error(`Texture path not found for sprite collection: ${chalk.green(scriptPath)}`);
    }
    return path.join(ASSET_EXTRACTOR_ROOT, "assets/ExportedProject", texturePath);
  }
}
