import { readFile } from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import { ASSET_EXTRACTOR_ROOT } from "../constants.ts";
import { Translation } from "./translation.model.ts";

export class TranslationRepository {
  private _translationLookup = new Map<string, string>();
  private readonly _SEARCH_FILES = [
    "assets/ExportedProject/Assets/resourcesbundle/strings/english_items/items.txt",
    "assets/ExportedProject/Assets/resourcesbundle/strings/english_items/enemies.txt",
  ].map((file) => path.join(ASSET_EXTRACTOR_ROOT, file));

  private constructor() {}

  static async create() {
    const instance = new TranslationRepository();
    return await instance.load();
  }

  private _extractTranslations(text: string): Record<string, string> {
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

  async load() {
    console.log(chalk.green("Loading item translations..."));

    for (const file of this._SEARCH_FILES) {
      const translationText = await readFile(file, "utf-8");
      const res = this._extractTranslations(translationText);

      for (const [key, value] of Object.entries(Translation.parse(res))) {
        if (this._translationLookup.has(key)) {
          throw new Error(`Duplicate translation key ${chalk.green(`"${key}"`)} found in ${file}`);
        }
        this._translationLookup.set(key, value);
      }
    }

    console.log(
      `Translation loaded. There are ${chalk.yellow(this._translationLookup.size)} entries for the item translations.`,
    );

    return this;
  }

  getItemTranslation(key: string): string {
    return this._translationLookup.get(key) ?? key;
  }
}
