import { readFile } from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import z from "zod/v4";
import { ASSET_EXTRACTOR_ROOT } from "../constants.ts";

export class TranslationRepository {
  private static _Schema = z.record(z.string(), z.string());
  private static _translationLookup = new Map<string, string>();
  private static readonly _BASE_ENGLISH_PATH = path.join(
    ASSET_EXTRACTOR_ROOT,
    "assets/ExportedProject/Assets/resourcesbundle/strings/english_items"
  );

  private static _extractTranslations(text: string): Record<string, string> {
    const lines = text.split("\n");
    const translations: Record<string, string> = {};

    let currentKey: string | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("#")) {
        currentKey = trimmed;
        translations[currentKey] = "";
      } else if (currentKey && trimmed !== "") {
        if (translations[currentKey]) {
          translations[currentKey] += "\n" + trimmed;
        } else {
          translations[currentKey] = trimmed;
        }
      }
    }

    return translations;
  }

  static async load() {
    console.log(chalk.green("Loading item translations..."));
    const translationText = await readFile(path.join(this._BASE_ENGLISH_PATH, "items.txt"), "utf-8");
    const res = this._extractTranslations(translationText);
    this._translationLookup = new Map(Object.entries(this._Schema.parse(res)));

    console.log(
      `Translation loaded. There are ${chalk.yellow(this._translationLookup.size)} entries for the item translations.`
    );
  }

  static getItemTranslation(key: string): string {
    return this._translationLookup.get(key) ?? key;
  }
}
