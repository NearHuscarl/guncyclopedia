import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import { EncounterTrackableRepository } from "../encouter-trackable/encounter-trackable.repository.ts";
import { TranslationRepository } from "../translation/translation.repository.ts";
import { GunRepository } from "../gun/gun.repository.ts";
import { DATA_PATH } from "../constants.ts";
import { GunModelGenerator } from "./gun-model-generator.ts";
import { ItemModelGenerator } from "./item-model-generator.ts";
import { ProjectileRepository } from "../gun/projectile.repository.ts";
import { VolleyRepository } from "../gun/volley.repository.ts";
import { AssetService } from "../asset/asset-service.ts";
import { SpriteService } from "../sprite/sprite.service.ts";
import { SpriteAnimatorRepository } from "../sprite/sprite-animator.repository.ts";
import { isGun, isItem } from "./client/helpers/types.ts";
import type { TPickupObject } from "./client/models/pickup-object.model.ts";

type TCreatePickupObjectsInput = {
  translationRepo: TranslationRepository;
  gunRepo: GunRepository;
  encounterTrackableRepo: EncounterTrackableRepository;
  projectileRepo: ProjectileRepository;
  volleyRepo: VolleyRepository;
  assetService: AssetService;
  spriteService: SpriteService;
  spriteAnimatorRepo: SpriteAnimatorRepository;
};

export async function createPickupObjects(options: TCreatePickupObjectsInput) {
  const {
    translationRepo,
    gunRepo,
    encounterTrackableRepo,
    projectileRepo,
    volleyRepo,
    assetService,
    spriteService,
    spriteAnimatorRepo,
  } = options;
  const pickupObjects: TPickupObject[] = [];
  const gunModelGenerator = await GunModelGenerator.create({
    gunRepo,
    projectileRepo,
    volleyRepo,
    translationRepo,
    assetService,
    spriteService,
    spriteAnimatorRepo,
  });
  const itemModelGenerator = new ItemModelGenerator({ translationRepo });

  console.log(chalk.green("Saving spritesheets from exported asset..."));
  const start = performance.now();
  await spriteService.saveSpritesheets();

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

  await mkdir(DATA_PATH, { recursive: true });
  await writeFile(path.join(DATA_PATH, "pickup-objects.json"), JSON.stringify(pickupObjects, null, 2), "utf-8");

  console.log();
  console.log(chalk.magenta(`createPickupObjects took ${(performance.now() - start) / 1000}s`));
}
