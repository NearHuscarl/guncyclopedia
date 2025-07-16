import { TranslationManager } from "./translation-manager.ts";
import { createPickupObjects } from "./pickup-objects.ts";
import { EncounterDatabase } from "./encounter-database.ts";
import { GunManager } from "./gun-manager.ts";

async function main() {
  await TranslationManager.load();
  await EncounterDatabase.load();
  await GunManager.load();
  await createPickupObjects();
}

await main();
