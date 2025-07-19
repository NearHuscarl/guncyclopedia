import { TranslationRepository } from "./translation/translation.repository.ts";
import { createPickupObjects } from "./pickup-objects.ts";
import { EncounterTrackableRepository } from "./encouter-trackable/encounter-trackable.repository.ts";
import { AssetService } from "./asset-service.ts";
import { GunRepository } from "./gun/gun.repository.ts";

async function main() {
  await AssetService.load();
  await TranslationRepository.load();
  await GunRepository.load();
  await EncounterTrackableRepository.load();
  await createPickupObjects();
}

await main();
