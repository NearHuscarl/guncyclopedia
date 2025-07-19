import chalk from "chalk";
import { EncounterDatabase } from "./encounter-trackable.dto.ts";
import { AssetService } from "../asset/asset-service.ts";
import type { TEnconterDatabase } from "./encounter-trackable.dto.ts";
import z from "zod/v4";

export class EncounterTrackableRepository {
  private static readonly _DEFAULT_DB_PATH = "assets/ExportedProject/Assets/data/databases/EncounterDatabase.asset";

  private _encounterDb: TEnconterDatabase | null = null;
  private readonly _assetService: AssetService;
  private readonly _encounterDbPath: string;

  private constructor(assetService: AssetService, encounterDbPath: string) {
    this._assetService = assetService;
    this._encounterDbPath = encounterDbPath || EncounterTrackableRepository._DEFAULT_DB_PATH;
  }

  static async create(_assetService: AssetService, encounterDbPath = EncounterTrackableRepository._DEFAULT_DB_PATH) {
    const instance = new EncounterTrackableRepository(_assetService, encounterDbPath);
    return await instance.load();
  }

  async load() {
    try {
      console.log(chalk.green("Loading Encounter Database..."));
      const [encounterDb] = await this._assetService.parseSerializedAsset(this._encounterDbPath);

      this._encounterDb = EncounterDatabase.parse(encounterDb);
      return this;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(chalk.red(`Error parsing EncounterDatabase`));
        console.error(z.prettifyError(error));
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
