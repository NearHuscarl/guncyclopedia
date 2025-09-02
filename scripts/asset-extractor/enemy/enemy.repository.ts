import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import z from "zod/v4";
import { ASSET_EXTRACTOR_ROOT } from "../constants.ts";
import { AssetService } from "../asset/asset-service.ts";
import { restoreCache, saveCache } from "../utils/cache.ts";
import { EnemyDto, type TAiActorData, type TEnemyDto } from "./enemy.dto.ts";
import { TranslationService } from "../translation/translation.service.ts";

export class EnemyRepository {
  private static readonly _SEARCH_DIRECTORIES = ["assets/ExportedProject/Assets/data/enemies"].map((dir) =>
    path.join(ASSET_EXTRACTOR_ROOT, dir),
  );

  private _enemies = new Map<string, TEnemyDto>();
  private readonly _assetService: AssetService;
  private readonly _translationService: TranslationService;
  private readonly _searchDirectories: string[];

  private constructor(
    assetService: AssetService,
    _translationService: TranslationService,
    searchDirectories?: string[],
  ) {
    this._assetService = assetService;
    this._translationService = _translationService;
    this._searchDirectories = searchDirectories || EnemyRepository._SEARCH_DIRECTORIES;
  }

  static async create(
    _assetService: AssetService,
    _translationService: TranslationService,
    searchDirectories?: string[],
  ) {
    const instance = new EnemyRepository(_assetService, _translationService, searchDirectories);
    return await instance.load();
  }

  private _isAiActor(obj: unknown): obj is TAiActorData {
    return this._assetService.isMonoScript(obj, "AIActor.cs.meta");
  }

  private async _getAllEnemyRefabFiles() {
    const res: string[] = [];

    for (const dir of this._searchDirectories) {
      const files = await readdir(dir);

      for (const file of files) {
        if (!file.endsWith(".prefab")) continue;
        const content = await readFile(path.join(dir, file), "utf-8");
        if (!content.includes("EnemyGuid")) continue; // quick check to filter out non-enemy prefabs

        res.push(path.join(dir, file));
      }
    }

    return res;
  }

  private async _parseEnemy(filePath: string) {
    const refab = await this._assetService.parseSerializedAsset(filePath);
    const res: Partial<TEnemyDto> = {};

    try {
      for (const component of refab) {
        if (!res.rootGameObject && this._assetService.isRootGameObject(component)) {
          res.rootGameObject = component;
        } else if (this._isAiActor(component)) {
          res.aiActor = component;
        } else if (this._assetService.isEncounterTrackable(component)) {
          res.encounterTrackable = component;
          res.encounterTrackable.m_journalData = this._translationService.getTranslatedJournalData(
            component.m_journalData,
          );
        }
      }

      return EnemyDto.parse(res);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(chalk.red(`Error parsing enemy dto at ${filePath}`));
        console.error(z.prettifyError(error));
      }
      throw error;
    }
  }

  async load() {
    console.log(chalk.green("Loading enemy data..."));

    this._enemies = await restoreCache("enemy.repository");

    if (this._enemies.size > 0) {
      console.log(chalk.green(`Loaded ${chalk.yellow(this._enemies.size)} enemies from cache.`));
      return this;
    }
    console.log(chalk.yellow("No cache found, loading enemies from files..."));

    const prefabFiles = await this._getAllEnemyRefabFiles();
    const start = performance.now();

    for (let i = 0; i < prefabFiles.length; i++) {
      const file = prefabFiles[i];
      process.stdout.write(chalk.grey(`\rloading enemies from ${i + 1}/${prefabFiles.length} files...`));
      const enemyDto = await this._parseEnemy(file);
      if (!enemyDto) continue;

      this._enemies.set(enemyDto.aiActor.EnemyGuid, enemyDto);
    }

    console.log();
    console.log(chalk.magenta(`Took ${(performance.now() - start) / 1000}s`));

    await saveCache("enemy.repository", this._enemies);
    return this;
  }

  getEnemy(enemyGuid: string) {
    return this._enemies.get(enemyGuid);
  }

  getEnemyName(enemyGuid: string) {
    const enemy = this.getEnemy(enemyGuid);
    return enemy?.encounterTrackable?.m_journalData.PrimaryDisplayName ?? enemy?.rootGameObject.m_Name ?? "Unknown";
  }
}
