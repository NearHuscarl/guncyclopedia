import path from "node:path";
import { ASSET_EXTRACTOR_ROOT, PUBLIC_PATH } from "./constants.ts";
import { AssetService } from "./asset/asset-service.ts";
import { SpriteRepository } from "./sprite/sprite.repository.ts";
import { SpriteService } from "./sprite/sprite.service.ts";

async function exportChestTextures(spriteRepo: SpriteRepository, spriteService: SpriteService) {
  const assetReference = {
    $$scriptPath: "Assets/sprites/items/chests/chest_collection data/Chest_Collection.prefab.meta",
  };

  const { spriteCollection, texturePath } = spriteRepo.getSprites(assetReference);
  for (const spriteData of spriteCollection) {
    if (!spriteData?.name) {
      continue;
    }
    const image = await spriteService.getImage(texturePath, spriteData);
    await image.toFile(path.join(PUBLIC_PATH, `chest_debug/${spriteData.name}.png`));
  }
}

export async function main() {
  const assetService = await AssetService.create();
  const spriteRepo = await SpriteRepository.create(
    assetService,
    [
      path.join(
        ASSET_EXTRACTOR_ROOT,
        "assets/ExportedProject/Assets/sprites/items/chests/chest_collection data/Chest_Collection.prefab",
      ),
    ],
    true,
  );
  const spriteService = await SpriteService.create(spriteRepo);

  await exportChestTextures(spriteRepo, spriteService);
}

await main();
