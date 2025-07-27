import { TranslationRepository } from "./translation/translation.repository.ts";
import { createPickupObjects } from "./pickup-object/pickup-objects.ts";
import { EncounterTrackableRepository } from "./encouter-trackable/encounter-trackable.repository.ts";
import { AssetService } from "./asset/asset-service.ts";
import { GunRepository } from "./gun/gun.repository.ts";
import { ProjectileRepository } from "./gun/projectile.repository.ts";
import { VolleyRepository } from "./gun/volley.repository.ts";
import { SpriteRepository } from "./sprite/sprite.repository.ts";
import { SpriteService } from "./sprite/sprite.service.ts";
import { SpriteAnimatorRepository } from "./sprite/sprite-animator.repository.ts";

async function main() {
  const assetService = await AssetService.create();
  const translationRepo = await TranslationRepository.create();
  const projectileRepo = await ProjectileRepository.create(assetService);
  const volleyRepo = await VolleyRepository.create(assetService);
  const gunRepo = await GunRepository.create(assetService);
  const spriteRepo = await SpriteRepository.create(assetService);
  const spriteService = new SpriteService(spriteRepo);
  const spriteAnimatorRepo = await SpriteAnimatorRepository.create(assetService, spriteRepo);
  const encounterTrackableRepo = await EncounterTrackableRepository.create(assetService);

  await createPickupObjects({
    translationRepo,
    gunRepo,
    encounterTrackableRepo,
    projectileRepo,
    volleyRepo,
    assetService,
    spriteService,
    spriteAnimatorRepo,
  });
}

await main();
