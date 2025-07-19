import chalk from "chalk";
import { EncounterDatabase } from "./encounter-trackable.dto.ts";
import { AssetService } from "../asset-service.ts";
import type { TEnconterDatabase } from "./encounter-trackable.dto.ts";
import z from "zod/v4";

export class EncounterTrackableRepository {
  private static _encounterDb: TEnconterDatabase | null = null;

  static async load() {
    try {
      console.log(chalk.green("Loading Encounter Database..."));
      const [encounterDb] = await AssetService.parseSerializedAsset(
        `assets/ExportedProject/Assets/data/databases/EncounterDatabase.asset`
      );

      this._encounterDb = EncounterDatabase.parse(encounterDb);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(chalk.red(`Error parsing EncounterDatabase`));
        console.error(z.prettifyError(error));
      } else {
        throw error;
      }
    }
  }

  static get entries() {
    if (!this._encounterDb) {
      throw new Error("Encounter database not loaded. Call EncounterDatabase.load() first.");
    }
    return this._encounterDb.Entries;
  }
}
