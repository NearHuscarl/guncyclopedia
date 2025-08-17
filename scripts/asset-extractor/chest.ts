import path from "node:path";
import { mkdir, rm } from "node:fs/promises";
import { ASSET_EXTRACTOR_ROOT, PUBLIC_PATH } from "./constants.ts";
import { AssetService } from "./asset/asset-service.ts";
import { SpriteRepository } from "./sprite/sprite.repository.ts";
import { SpriteService } from "./sprite/sprite.service.ts";

async function exportChestTextures(
  spriteRepo: SpriteRepository,
  spriteService: SpriteService,
  chestCollectionPath: string,
) {
  const assetReference = {
    $$scriptPath: chestCollectionPath,
  };

  await rm(path.join(PUBLIC_PATH, "chest_debug"), { recursive: true, force: true });
  await mkdir(path.join(PUBLIC_PATH, "chest_debug"), { recursive: true });
  const { spriteCollection, texturePath } = spriteRepo.getSprites(assetReference);
  for (const spriteData of spriteCollection) {
    if (!spriteData?.name) {
      continue;
    }
    const image = await spriteService.getImage(texturePath, spriteData);
    await image.toFile(path.join(PUBLIC_PATH, `chest_debug/${spriteData.name}.png`));
  }
}

// References:
// Status Effects: assets/ExportedProject/Assets/sprites/vfx/character vfx collection data/Character VFX Collection.prefab
// Shrine, pedestal: assets/ExportedProject/Assets/sprites/environment/environment_gungeon_collection data/Environment_Gungeon_Collection.prefab
// Lots of cool icons: ExportedProject/Assets/art/ui/GameUIAtlas.png
export async function main() {
  const chestCollectionPath = path.join(
    ASSET_EXTRACTOR_ROOT,
    "assets/ExportedProject/Assets/sprites/weapons/weaponcollection02 data/WeaponCollection02.prefab",
  );
  const assetService = await AssetService.create();
  const spriteRepo = await SpriteRepository.create(assetService, [chestCollectionPath], true);
  const spriteService = await SpriteService.create(spriteRepo);

  await exportChestTextures(spriteRepo, spriteService, chestCollectionPath);
}

await main();
