import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import z from "zod/v4";
import { ASSET_EXTRACTOR_ROOT } from "../constants.ts";
import { AssetService } from "../asset/asset-service.ts";
import { restoreCache, saveCache } from "../utils/cache.ts";
import { GrapplingHookProjectileData, ProjectileDto } from "./projectile.dto.ts";
import type {
  TBasicBeamControllerData,
  TBlackHoleDoerData,
  TBounceProjModifierData,
  TCerebralBoreProjectileData,
  TExplosiveModifierData,
  TGoopModifierData,
  THomingModifierData,
  TGoodDefinitionData,
  TPierceProjModifierData,
  TProjectileData,
  TProjectileDto,
  TRaidenBeamControllerData,
  TModifyProjectileSynergyProcessorData,
  TMindControlProjectileModifierData,
  THelixProjectileData,
  TMatterAntimatterProjectileModifierData,
  TStickyGrenadeBuffData,
  TDevolverModifierData,
  TSpawnProjModifierData,
  TRobotechProjectileData,
  TBeeProjectileData,
  TBoomerangProjectileData,
  THealthModificationBuffData,
  TReverseBeamControllerData,
  TThreeWishesBuffData,
  TChainLightningModifierData,
  TRestoreAmmoToGunModifierData,
} from "./projectile.dto.ts";

type Guid = string;

export class ProjectileRepository {
  private static readonly _SEARCH_DIRECTORIES = [
    "assets/ExportedProject/Assets/GameObject",
    "assets/ExportedProject/Assets/data/projectiles",
    "assets/ExportedProject/Assets/data/projectiles/beams",
  ].map((dir) => path.join(ASSET_EXTRACTOR_ROOT, dir));

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

  private _isProjectileData(obj: unknown): obj is TProjectileData {
    return this._assetService.isMonoScript(obj, "Projectile.cs.meta");
  }
  isCerebralBoreProjectile(obj: unknown): obj is TCerebralBoreProjectileData {
    return this._assetService.isMonoScript(obj, "CerebralBoreProjectile.cs.meta");
  }
  isHelixProjectileData(obj: unknown): obj is THelixProjectileData {
    return this._assetService.isMonoScript(obj, "HelixProjectile.cs.meta");
  }
  isBoomerangProjectileData(obj: unknown): obj is TBoomerangProjectileData {
    return this._assetService.isMonoScript(obj, "BoomerangProjectile.cs.meta");
  }
  isBeeProjectileData(obj: unknown): obj is TBeeProjectileData {
    return this._assetService.isMonoScript(obj, "BeeProjectile.cs.meta");
  }
  isRobotechProjectileData(obj: unknown): obj is TRobotechProjectileData {
    return this._assetService.isMonoScript(obj, "RobotechProjectile.cs.meta");
  }
  private _isBounceModifierData(obj: unknown): obj is TBounceProjModifierData {
    return this._assetService.isMonoScript(obj, "BounceProjModifier.cs.meta");
  }
  private _isPierceModifierData(obj: unknown): obj is TPierceProjModifierData {
    return this._assetService.isMonoScript(obj, "PierceProjModifier.cs.meta");
  }
  private _isExplosiveModifierData(obj: unknown): obj is TExplosiveModifierData {
    return this._assetService.isMonoScript(obj, "ExplosiveModifier.cs.meta");
  }
  private _isHomingModifierData(obj: unknown): obj is THomingModifierData {
    return this._assetService.isMonoScript(obj, "HomingModifier.cs.meta");
  }
  private _isSpawnModifierData(obj: unknown): obj is TSpawnProjModifierData {
    return this._assetService.isMonoScript(obj, "SpawnProjModifier.cs.meta");
  }
  private _isGoopModifierData(obj: unknown): obj is TGoopModifierData {
    return this._assetService.isMonoScript(obj, "GoopModifier.cs.meta");
  }
  private _isGoopDefinitionData(obj: unknown): obj is TGoodDefinitionData {
    return this._assetService.isMonoScript(obj, "GoopDefinition.cs.meta");
  }
  private _isChainLightningModifierData(obj: unknown): obj is TChainLightningModifierData {
    return this._assetService.isMonoScript(obj, "ChainLightningModifier.cs.meta");
  }
  private _isRestoreAmmoToGunModifierData(obj: unknown): obj is TRestoreAmmoToGunModifierData {
    return this._assetService.isMonoScript(obj, "RestoreAmmoToGunModifier.cs.meta");
  }
  private _isModifyProjectileSynergyProcessorData(obj: unknown): obj is TModifyProjectileSynergyProcessorData {
    return this._assetService.isMonoScript(obj, "ModifyProjectileSynergyProcessor.cs.meta");
  }
  private _isBasicBeamControllerData(obj: unknown): obj is TBasicBeamControllerData {
    return this._assetService.isMonoScript(obj, "BasicBeamController.cs.meta");
  }
  private _isRaidenBeamControllerData(obj: unknown): obj is TRaidenBeamControllerData {
    return this._assetService.isMonoScript(obj, "RaidenBeamController.cs.meta");
  }
  private _isReverseBeamControllerData(obj: unknown): obj is TReverseBeamControllerData {
    return this._assetService.isMonoScript(obj, "ReverseBeamController.cs.meta");
  }
  private _isBlackHoleDoerData(obj: unknown): obj is TBlackHoleDoerData {
    return this._assetService.isMonoScript(obj, "BlackHoleDoer.cs.meta");
  }
  private _isMindControlProjectileModifierData(obj: unknown): obj is TMindControlProjectileModifierData {
    return this._assetService.isMonoScript(obj, "MindControlProjectileModifier.cs.meta");
  }
  private _isMatterAntimatterProjectileModifierData(obj: unknown): obj is TMatterAntimatterProjectileModifierData {
    return this._assetService.isMonoScript(obj, "MatterAntimatterProjectileModifier.cs.meta");
  }
  private _isStickyGrenadeBuffData(obj: unknown): obj is TStickyGrenadeBuffData {
    return this._assetService.isMonoScript(obj, "StickyGrenadeBuff.cs.meta");
  }
  private _isHealthModificationBuffData(obj: unknown): obj is THealthModificationBuffData {
    return this._assetService.isMonoScript(obj, "HealthModificationBuff.cs.meta");
  }
  private _isThreeWishesBuffData(obj: unknown): obj is TThreeWishesBuffData {
    return this._assetService.isMonoScript(obj, "ThreeWishesBuff.cs.meta");
  }
  private _isDevolverModifierData(obj: unknown): obj is TDevolverModifierData {
    return this._assetService.isMonoScript(obj, "DevolverModifier.cs.meta");
  }

  private async _getAllProjectileRefabFiles() {
    const res: string[] = [];

    for (const dir of this._searchDirectories) {
      const files = await readdir(dir);

      for (const file of files) {
        if (!file.endsWith(".prefab")) continue;
        const content = await readFile(path.join(dir, file), "utf-8");
        if (!content.includes("AppliesPoison") && !file.endsWith("GrapplingHook.prefab")) continue; // quick check to filter out non-projectile prefabs

        res.push(path.join(dir, file));
      }
    }

    return res;
  }

  private async _parseProjectile(filePath: string) {
    const refab = await this._assetService.parseSerializedAsset(filePath);
    const res: Partial<TProjectileDto> = {};

    try {
      if (filePath.endsWith("GrapplingHook.prefab")) {
        res.id = this._getProjectileKey({ $$scriptPath: filePath + ".meta" });
        res.projectile = GrapplingHookProjectileData.parse({});
      }

      for (const component of refab) {
        if (this._isProjectileData(component) && !res.projectile) {
          res.id = this._getProjectileKey({ $$scriptPath: filePath + ".meta" });
          res.projectile = component;
        } else if (this._assetService.isSpriteData(component)) {
          res.sprite = component;
        } else if (this._assetService.isSpriteAnimatorData(component)) {
          res.spriteAnimator = component;
        } else if (this._isBounceModifierData(component)) {
          res.bounceProjModifier = component;
        } else if (this._isPierceModifierData(component)) {
          res.pierceProjModifier = component;
        } else if (this._isExplosiveModifierData(component)) {
          res.explosiveModifier = component;
        } else if (this._isHomingModifierData(component)) {
          res.homingModifier = component;
        } else if (this._isSpawnModifierData(component)) {
          res.spawnProjModifier = component;
        } else if (this._isGoopModifierData(component)) {
          res.goopModifier = component;

          const prefab2 = await this._assetService.parseSerializedAssetFromReference(component.goopDefinition);

          for (const component2 of prefab2) {
            if (this._isGoopDefinitionData(component2)) {
              res.goopModifier.goopDefinitionData = component2;
              break;
            }
          }
        } else if (this._isChainLightningModifierData(component)) {
          res.chainLightningModifier = component;
        } else if (this._isRestoreAmmoToGunModifierData(component)) {
          res.restoreAmmoToGunModifier = component;
        } else if (this._isModifyProjectileSynergyProcessorData(component)) {
          res.modifyProjectileSynergyProcessor = component;
        } else if (this._isBasicBeamControllerData(component)) {
          res.basicBeamController = component;
        } else if (this._isRaidenBeamControllerData(component)) {
          res.raidenBeamController = component;
        } else if (this._isReverseBeamControllerData(component)) {
          res.reverseBeamController = component;
        } else if (this._isBlackHoleDoerData(component)) {
          res.blackHoleDoer = component;
        } else if (this._isMindControlProjectileModifierData(component)) {
          res.mindControlProjModifier = component;
        } else if (this._isMatterAntimatterProjectileModifierData(component)) {
          res.matterAntimatterProjModifier = component;
        } else if (this._isStickyGrenadeBuffData(component)) {
          res.stickyGrenadeBuff = component;
        } else if (this._isHealthModificationBuffData(component)) {
          res.healthModificationBuff = component;
        } else if (this._isThreeWishesBuffData(component)) {
          res.threeWishesBuff = component;
        } else if (this._isDevolverModifierData(component)) {
          res.devolverModifier = component;
        }
      }

      return ProjectileDto.parse(res);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(chalk.red(`Error parsing projectile dto at ${filePath}`));
        console.error(chalk.red(z.prettifyError(error)));
        process.exit(1);
      } else {
        throw error;
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

      this._projectiles.set(projDto.id, projDto);
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
