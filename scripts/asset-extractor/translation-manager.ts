import { readFile } from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";

export class TranslationManager {
  private static _items: Record<string, string> = {};

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
    const translationText = await readFile(path.join(import.meta.dirname, "translation/items.txt"), {
      encoding: "utf-8",
    });
    this._items = this._extractTranslations(translationText);
    console.log(
      `Translation loaded. There are ${chalk.yellow(
        Object.keys(translationText).length
      )} entries for the item translations.`
    );
  }

  static getItemTranslation(key: string): string {
    return this._items[key];
  }
}
