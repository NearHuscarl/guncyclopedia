import { writeFile } from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import { EncounterTrackableRepository } from "../encouter-trackable/encounter-trackable.repository.ts";
import { TranslationRepository } from "../translation/translation.repository.ts";
import { GunRepository } from "../gun/gun.repository.ts";
import { ASSET_EXTRACTOR_ROOT } from "../constants.ts";
import { GunModelGenerator } from "./gun-model-generator.ts";
import { ItemModelGenerator } from "./item-model-generator.ts";
import { ProjectileRepository } from "../gun/projectile.repository.ts";
import { VolleyRepository } from "../gun/volley.repository.ts";
import { AssetService } from "../asset/asset-service.ts";
import type { TGun } from "./gun.model.ts";
import type { TItem } from "./item.model.ts";
import type { TPickupObject } from "./pickup-object.model.ts";

export function isGun(obj: object): obj is TGun {
  return typeof obj === "object" && "type" in obj && obj.type === "gun";
}

export function isItem(obj: object): obj is TItem {
  return typeof obj === "object" && "type" in obj && obj.type === "item";
}

type TCreatePickupObjectsInput = {
  translationRepo: TranslationRepository;
  gunRepo: GunRepository;
  encounterTrackableRepo: EncounterTrackableRepository;
  projectileRepo: ProjectileRepository;
  volleyRepo: VolleyRepository;
  assetService: AssetService;
};

export async function createPickupObjects(options: TCreatePickupObjectsInput) {
  const { translationRepo, gunRepo, encounterTrackableRepo, projectileRepo, volleyRepo, assetService } = options;
  const pickupObjects: TPickupObject[] = [];
  const gunModelGenerator = new GunModelGenerator({
    gunRepo,
    projectileRepo,
    volleyRepo,
    translationRepo,
    assetService,
  });
  const itemModelGenerator = new ItemModelGenerator({ translationRepo });

  for (const entry of encounterTrackableRepo.entries) {
    if (entry.pickupObjectId === -1 || entry.journalData.IsEnemy === 1) {
      continue; // an enemy or something else
    }

    const isItem = entry.isPlayerItem === 1 || entry.isPassiveItem === 1;
    const isGun = entry.shootStyleInt >= 0;

    if (isItem) {
      const item = itemModelGenerator.generate(entry);
      if (item) pickupObjects.push(item);
    } else if (isGun) {
      const gun = await gunModelGenerator.generate(entry);
      if (gun) pickupObjects.push(gun);
    } else {
      const name = translationRepo.getItemTranslation(entry.journalData.PrimaryDisplayName ?? "");
      console.warn(chalk.yellow(`Unknown pickup object type for ID ${entry.pickupObjectId}, name: ${name}`));
    }
  }

  const itemCount = chalk.yellow(pickupObjects.filter(isItem).length);
  const gunCount = chalk.yellow(pickupObjects.filter(isGun).length);
  const totalCount = chalk.yellow(pickupObjects.length);
  console.log(chalk.green(`Collected ${totalCount} pickup objects: ${itemCount} items and ${gunCount} guns.`));

  await writeFile(
    path.join(ASSET_EXTRACTOR_ROOT, "out/pickup-objects.json"),
    JSON.stringify(pickupObjects, null, 2),
    "utf-8"
  );
}
