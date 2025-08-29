import chalk from "chalk";
import z from "zod/v4";
import { Item } from "./client/models/item.model.ts";
import type { TItem } from "./client/models/item.model.ts";
import type { TEncounterDatabase } from "../encouter-trackable/encounter-trackable.dto.ts";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type ItemModelGeneratorCtor = {};

export class ItemModelGenerator {
  constructor(_props: ItemModelGeneratorCtor) {}

  generate(entry: TEncounterDatabase["Entries"][number]): TItem | undefined {
    try {
      const texts = {
        name: entry.journalData.PrimaryDisplayName ?? "",
        quote: entry.journalData.NotificationPanelDescription ?? "",
        description: entry.journalData.AmmonomiconFullEntry ?? "",
      };
      if (!texts.name || !texts.quote || !texts.description) {
        console.warn(
          chalk.yellow(`Missing translation for pickup object ID ${entry.pickupObjectId}. path: ${entry.path}`),
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
