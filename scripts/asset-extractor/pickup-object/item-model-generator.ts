import chalk from "chalk";
import z from "zod/v4";
import { Item } from "./item.model.ts";
import type { TItem } from "./item.model.ts";
import type { TEnconterDatabase } from "../encouter-trackable/encounter-trackable.dto.ts";
import type { TranslationRepository } from "../translation/translation.repository.ts";

type ItemModelGeneratorCtor = {
  translationRepo: TranslationRepository;
};

export class ItemModelGenerator {
  private readonly _translationRepo: TranslationRepository;

  constructor({ translationRepo }: ItemModelGeneratorCtor) {
    this._translationRepo = translationRepo;
  }

  generate(entry: TEnconterDatabase["Entries"][number]): TItem | undefined {
    try {
      const texts = {
        name: this._translationRepo.getItemTranslation(entry.journalData.PrimaryDisplayName ?? ""),
        quote: this._translationRepo.getItemTranslation(entry.journalData.NotificationPanelDescription ?? ""),
        description: this._translationRepo.getItemTranslation(entry.journalData.AmmonomiconFullEntry ?? ""),
      };
      if (!texts.name || !texts.quote || !texts.description) {
        console.warn(
          chalk.yellow(`Missing translation for pickup object ID ${entry.pickupObjectId}. path: ${entry.path}`)
        );
        return;
      }

      // TODO: add item quality and more if needed
      return Item.parse({
        ...texts,
        id: entry.pickupObjectId,
        type: "item",
        isPassive: entry.isPassiveItem === 1,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(chalk.red(`Error parsing ITEM pickup-object with ID ${entry.pickupObjectId}:`));
        console.error(z.prettifyError(error));
      }
      throw error;
    }
  }
}
