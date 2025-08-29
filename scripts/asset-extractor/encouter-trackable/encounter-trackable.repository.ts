import path from "node:path";
import z from "zod/v4";
import chalk from "chalk";
import { EncounterDatabase } from "./encounter-trackable.dto.ts";
import { AssetService } from "../asset/asset-service.ts";
import { ASSET_EXTRACTOR_ROOT } from "../constants.ts";
import { TranslationService } from "../translation/translation.service.ts";
import type { TEncounterDatabase } from "./encounter-trackable.dto.ts";

export class EncounterTrackableRepository {
  private static readonly _DEFAULT_DB_PATH = path.join(
    ASSET_EXTRACTOR_ROOT,
    "assets/ExportedProject/Assets/data/databases/EncounterDatabase.asset",
  );

  private _encounterDb: TEncounterDatabase | null = null;
  private readonly _assetService: AssetService;
  private readonly _encounterDbPath: string;
  private readonly _translationService: TranslationService;

  private constructor(assetService: AssetService, encounterDbPath: string, translationService: TranslationService) {
    this._assetService = assetService;
    this._encounterDbPath = encounterDbPath || EncounterTrackableRepository._DEFAULT_DB_PATH;
    this._translationService = translationService;
  }

  static async create(
    _assetService: AssetService,
    translationService: TranslationService,
    encounterDbPath = EncounterTrackableRepository._DEFAULT_DB_PATH,
  ) {
    const instance = new EncounterTrackableRepository(_assetService, encounterDbPath, translationService);
    return await instance.load();
  }

  private _applyEnglishTranslation(encounterDb: TEncounterDatabase): TEncounterDatabase {
    for (const entry of encounterDb.Entries) {
      entry.journalData = this._translationService.getTranslatedJournalData(entry.journalData);
    }

    return encounterDb;
  }

  async load() {
    try {
      console.log(chalk.green("Loading Encounter Database..."));
      const [encounterDb] = await this._assetService.parseSerializedAsset(this._encounterDbPath);

      this._encounterDb = this._applyEnglishTranslation(EncounterDatabase.parse(encounterDb));

      return this;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(chalk.red(`Error parsing EncounterDatabase`));
        console.error(z.prettifyError(error).slice(0, 300));
        process.exit(1);
      } else {
        throw error;
      }
    }
  }

  get entries() {
    if (!this._encounterDb) {
      throw new Error("Encounter database not loaded. Call EncounterDatabase.load() first.");
    }
    return this._encounterDb.Entries;
  }
}
