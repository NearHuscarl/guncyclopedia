import { readFile } from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import z from "zod/v4";

export type TEnconterDatabase = z.input<typeof EncounterDatabase.Schema>;

export class EncounterDatabase {
  private static _encounterDb: TEnconterDatabase | null = null;

  static Schema = z.object({
    Entries: z.array(
      z.object({
        path: z.string(),
        pickupObjectId: z.number(),
        isPassiveItem: z.union([z.literal(1), z.literal(0)]).optional(),
        isPlayerItem: z.union([z.literal(1), z.literal(0)]),
        shootStyleInt: z.number(),
        doesntDamageSecretWalls: z.number(),
        isInfiniteAmmoGun: z.number(),
        journalData: z.object({
          PrimaryDisplayName: z.string(),
          NotificationPanelDescription: z.string(),
          AmmonomiconFullEntry: z.string(),
          IsEnemy: z.union([z.literal(1), z.literal(0)]),
        }),
      })
    ),
  });

  static async load() {
    console.log(chalk.green("Loading Encounter Database..."));
    const encounterDb: TEnconterDatabase = JSON.parse(
      await readFile(path.join(import.meta.dirname, `assets/MonoBehaviour/EncounterDatabase.json`), {
        encoding: "utf-8",
      })
    );

    this._encounterDb = this.Schema.parse(encounterDb);
  }

  static get entries() {
    if (!this._encounterDb) {
      throw new Error("Encounter database not loaded. Call EncounterDatabase.load() first.");
    }
    return this._encounterDb.Entries;
  }
}
