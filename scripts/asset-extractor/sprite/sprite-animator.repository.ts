import path from "node:path";
import chalk from "chalk";
import z from "zod/v4";
import sumBy from "lodash/sumBy.js";
import { SpriteAnimatorDto } from "./sprite-animator.dto.ts";
import { AssetService } from "../asset/asset-service.ts";
import { restoreCache, saveCache } from "../utils/cache.ts";
import { ASSET_EXTRACTOR_ROOT } from "../constants.ts";
import { normalizePath } from "../utils/path.ts";
import { SpriteRepository } from "./sprite.repository.ts";
import type { TSpriteAnimatorDto } from "./sprite-animator.dto.ts";

type TCollectionPath = string;

export class SpriteAnimatorRepository {
  private static readonly _SEARCH_FILES = [
    "assets/ExportedProject/Assets/GameObject/Dolphin_WeaponAnimation.prefab",
    "assets/ExportedProject/Assets/GameObject/BeamWeaponAnimation.prefab",
    "assets/ExportedProject/Assets/GameObject/GunAnimation3.prefab",
    "assets/ExportedProject/Assets/sprites/weapons/GunAnimation.prefab",
    "assets/ExportedProject/Assets/sprites/weapons/GunAnimation02.prefab",
    "assets/ExportedProject/Assets/sprites/weapons/GunBeamAnimation.prefab",
    "assets/ExportedProject/Assets/GameObject/Boss_West_Bros_Animation.prefab",
  ].map((p) => path.join(ASSET_EXTRACTOR_ROOT, p));

  private _clips = new Map<TCollectionPath, TSpriteAnimatorDto>();
  private _clipLookup = new Map<TCollectionPath, Record<string, TSpriteAnimatorDto["clips"][number]>>();
  private readonly _assetService: AssetService;
  private readonly _spriteRepository: SpriteRepository;

  readonly searchFiles: string[];

  private constructor(assetService: AssetService, _spriteRepository: SpriteRepository, searchFiles: string[]) {
    this._assetService = assetService;
    this._spriteRepository = _spriteRepository;
    this.searchFiles = searchFiles;
  }

  static async create(
    _assetService: AssetService,
    _spriteRepository: SpriteRepository,
    searchFiles = SpriteAnimatorRepository._SEARCH_FILES
  ) {
    const instance = new SpriteAnimatorRepository(_assetService, _spriteRepository, searchFiles);
    return await instance.load();
  }
  private _isSpriteAnimatorData(obj: unknown): obj is TSpriteAnimatorDto {
    return this._assetService.isMonoBehaviour(obj) && obj.m_Script.$$scriptPath.endsWith("tk2dSpriteAnimation.cs.meta");
  }

  private async _parseAnimator(filePath: string) {
    const refab = await this._assetService.parseSerializedAsset(filePath);

    try {
      for (const block of refab) {
        if (!this._isSpriteAnimatorData(block)) continue;

        for (const clip of block.clips) {
          for (const frame of clip.frames) {
            const scriptPath = path.join(
              ASSET_EXTRACTOR_ROOT,
              "assets/ExportedProject",
              frame.spriteCollection.$$scriptPath
            );
            const texturePath = this._spriteRepository.getSpriteTexturePath(scriptPath);

            if (!block.$$texturePath) {
              block.$$texturePath = texturePath;
            } else if (block.$$texturePath !== texturePath) {
              throw new Error(
                `Inconsistent texture paths for animation in ${filePath}: ${block.$$texturePath} vs ${texturePath}`
              );
            }
          }
        }
        return SpriteAnimatorDto.parse(block);
      }
      throw new Error(`No sprite animation found in ${filePath}`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(chalk.red(`Error parsing sprite animation dto at ${filePath}`));
        console.error(chalk.red(z.prettifyError(error).slice(0, 300)));
        process.exit(1);
      } else {
        throw error;
      }
    }
  }

  private async _loadAnimatorData() {
    console.log(chalk.green("Loading animation data..."));

    this._clips = await restoreCache("animation.repository");

    if (this._clips.size > 0) {
      const totalClips = sumBy(Array.from(this._clips.values()), (cur) => cur.clips.length);
      console.log(chalk.green(`Loaded ${chalk.yellow(totalClips)} clips from cache.`));
      return;
    }
    console.log(chalk.yellow("No cache found, loading animation from files..."));

    const start = performance.now();

    for (let i = 0; i < this.searchFiles.length; i++) {
      const file = this.searchFiles[i];
      process.stdout.write(chalk.grey(`\rloading sprite animation from ${i + 1}/${this.searchFiles.length} files...`));
      const animatorDto = await this._parseAnimator(file);
      this._clips.set(normalizePath(file), animatorDto);
    }

    console.log();
    console.log(chalk.magenta(`Took ${(performance.now() - start) / 1000}s`));

    await saveCache("animation.repository", this._clips);
  }

  async load() {
    await this._loadAnimatorData();
    for (const [path, animatorDto] of this._clips.entries()) {
      this._clipLookup.set(normalizePath(path), Object.fromEntries(animatorDto.clips.map((clip) => [clip.name, clip])));
    }
    return this;
  }

  getClip(assetReference: { $$scriptPath: string }, name: string) {
    const scriptPath = path.isAbsolute(assetReference.$$scriptPath)
      ? assetReference.$$scriptPath
      : path.join(ASSET_EXTRACTOR_ROOT, "assets/ExportedProject", assetReference.$$scriptPath.replace(/\.meta$/, ""));
    let collection = this._clips.get(normalizePath(scriptPath));
    let clipData = this._clipLookup.get(normalizePath(scriptPath))?.[name];

    if (!collection) {
      for (const [path, clips] of this._clipLookup.entries()) {
        if (clips[name]) {
          console.warn(
            chalk.yellow(
              `Warning: ${chalk.green(name)} clip is not found in collection ${chalk.green(
                scriptPath
              )}, but it exists in ${chalk.green(path)}`
            )
          );
          collection = this._clips.get(path);
          clipData = clips[name];
          break;
        }
      }
      if (!collection) {
        throw new Error(
          `Cannot find ${chalk.green(name)} clip because Animation collection is not found: ${chalk.green(scriptPath)}`
        );
      }
    }

    return {
      clipData,
      texturePath: path.join(ASSET_EXTRACTOR_ROOT, "assets/ExportedProject", collection.$$texturePath),
    };
  }
}
