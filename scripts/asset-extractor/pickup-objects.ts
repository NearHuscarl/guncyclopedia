import { writeFile } from "node:fs/promises";
import path from "node:path";
import { EncounterDatabase } from "./encounter-database.ts";
import { TranslationManager } from "./translation-manager.ts";
import z from "zod/v4";
import chalk from "chalk";
import invert from "lodash/invert.js";
import { GunDto, GunManager } from "./gun-manager.ts";

const PickupObject = z.object({
  id: z.number(),
  name: z.string(),
  quote: z.string(),
  description: z.string(),
  type: z.enum(["gun", "item"]),
});

const Gun = PickupObject.extend({
  type: z.literal("gun"),
  quality: z.enum(["EXCLUDED", "SPECIAL", "COMMON", "D", "C", "B", "A", "S"]),
  gunClass: z.enum([
    "NONE",
    "PISTOL",
    "SHOTGUN",
    "FULLAUTO",
    "RIFLE",
    "BEAM",
    "POISON",
    "FIRE",
    "ICE",
    "CHARM",
    "EXPLOSIVE",
    "SILLY",
    "SHITTY",
    "CHARGE",
  ]),
  shootStyle: z.enum(["SemiAutomatic", "Automatic", "Beam", "Charged", "Burst"]),
  maxAmmo: z.number(),
  magazineSize: z.number(),
  reloadTime: z.number(),
  spread: z.number(),
  hasInfiniteAmmo: z.boolean().optional(),
  doesntDamageSecretWalls: z.boolean().optional(),
});
const Item = PickupObject.extend({
  type: z.literal("item"),
  isPassive: z.boolean(),
});

type TPickupObject = z.input<typeof PickupObject>;
type TGun = z.input<typeof Gun>;
type TItem = z.input<typeof Item>;

export function isGun(obj: object): obj is TGun {
  return typeof obj === "object" && "type" in obj && obj.type === "gun";
}

export function isItem(obj: object): obj is TItem {
  return typeof obj === "object" && "type" in obj && obj.type === "item";
}

export async function createPickupObjects() {
  const pickupObjects: TPickupObject[] = [];
  const gunQualityTextLookup = invert(GunDto.ItemQuality);
  const gunClassTextLookup = invert(GunDto.GunClass);
  const shootStyleTextLookup = invert(GunDto.ShootStyle);
  const unusedGunIds = new Set([
    // https://enterthegungeon.fandom.com/wiki/Black_Revolver
    405,
    // https://enterthegungeon.wiki.gg/wiki/Ice_Ogre_Head
    226,
    // https://enterthegungeon.fandom.com/wiki/Megaphone
    361,
    // https://enterthegungeon.fandom.com/wiki/Portaler
    391,
    // https://enterthegungeon.fandom.com/wiki/Gundertale
    509,
    // https://the-advanced-ammonomicon.fandom.com/wiki/Flamethrower
    46,
  ]);

  for (const entry of EncounterDatabase.entries) {
    if (entry.pickupObjectId === -1 || entry.journalData.IsEnemy === 1) {
      continue; // an enemy or something else
    }
    const texts = {
      name: TranslationManager.getItemTranslation(entry.journalData.PrimaryDisplayName),
      quote: TranslationManager.getItemTranslation(entry.journalData.NotificationPanelDescription),
      description: TranslationManager.getItemTranslation(entry.journalData.AmmonomiconFullEntry),
    };

    if (!texts.name || !texts.quote || !texts.description) {
      console.warn(
        chalk.yellow(`Missing translation for pickup object ID ${entry.pickupObjectId}. path: ${entry.path}`)
      );
      continue;
    }

    const pickupObject: Record<string, string | number> = {
      ...texts,
      id: entry.pickupObjectId,
    };

    if (entry.isPlayerItem === 1 || entry.isPassiveItem === 1) {
      pickupObject.type = "item";
    } else if (entry.shootStyleInt >= 0) {
      pickupObject.type = "gun";
    }

    try {
      if (isItem(pickupObject)) {
        pickupObject.isPassive = entry.isPassiveItem === 1;
        // TODO: add item quality and more if needed
        pickupObjects.push(Item.parse(pickupObject));
      } else if (isGun(pickupObject)) {
        if (unusedGunIds.has(pickupObject.id)) {
          continue;
        }

        const gunDto = GunManager.getGun(pickupObject.id);
        if (!gunDto) {
          console.warn(chalk.yellow(`Gun with ID ${pickupObject.id} (${texts.name}) not found in GunManager.`));
          continue;
        }

        pickupObject.quality = gunQualityTextLookup[gunDto.quality] as typeof pickupObject.quality;
        pickupObject.gunClass = gunClassTextLookup[gunDto.gunClass] as typeof pickupObject.gunClass;
        pickupObject.shootStyle = shootStyleTextLookup[
          gunDto.singleModule.shootStyle
        ] as typeof pickupObject.shootStyle;
        pickupObject.maxAmmo = gunDto.maxAmmo;
        pickupObject.magazineSize = gunDto.singleModule.numberOfShotsInClip;
        pickupObject.reloadTime = gunDto.reloadTime;
        pickupObject.spread = gunDto.singleModule.angleVariance;
        if (entry.isInfiniteAmmoGun === 1) pickupObject.hasInfiniteAmmo = true;
        if (entry.doesntDamageSecretWalls === 1) pickupObject.doesntDamageSecretWalls = true;
        pickupObjects.push(Gun.parse(pickupObject));
      } else {
        console.warn(chalk.yellow(`Unknown pickup object type for ID ${pickupObject.id}:`, texts.name));
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(chalk.red(`Error parsing pickup object with ID ${pickupObject.id}:`));
        console.error(z.flattenError(error));
      }
      throw error;
    }
  }

  await writeFile(path.join(import.meta.dirname, "out/pickup-objects.json"), JSON.stringify(pickupObjects, null, 2), {
    encoding: "utf-8",
  });
}
