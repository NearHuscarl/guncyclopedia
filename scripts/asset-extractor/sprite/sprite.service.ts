import path from "node:path";
import sharp from "sharp";
import chalk from "chalk";
import { SpriteRepository } from "./sprite.repository.ts";
import { OUTPUT_ROOT } from "../constants.ts";
import { cp, mkdir } from "node:fs/promises";
import { normalizePath } from "../utils/path.ts";
import type { TSpriteCollectionDto } from "./sprite.dto.ts";

export class SpriteService {
  private readonly _spriteRepository: SpriteRepository;

  constructor(spriteRepository: SpriteRepository) {
    this._spriteRepository = spriteRepository;
  }

  private async _generateSpriteImage(
    texturePath: string,
    spriteData: TSpriteCollectionDto["spriteDefinitions"][number],
    outputImage: string
  ) {
    let image = sharp(texturePath);
    const { width, height } = await image.metadata();

    if (!width || !height) {
      throw new Error(`Failed to read image size for ${chalk.green(texturePath)}`);
    }

    // Convert UVs to pixel coordinates
    const pixelCoords = spriteData.uvs.map(({ x, y }) => ({
      x: x * width,
      y: (1 - y) * height, // flip Y
    }));

    const minX = Math.min(...pixelCoords.map((p) => p.x));
    const minY = Math.min(...pixelCoords.map((p) => p.y));
    const maxX = Math.max(...pixelCoords.map((p) => p.x));
    const maxY = Math.max(...pixelCoords.map((p) => p.y));

    const extractRegion = {
      left: Math.floor(minX),
      top: Math.floor(minY),
      width: Math.ceil(maxX - minX),
      height: Math.ceil(maxY - minY),
    };

    image = image.extract(extractRegion);
    if (spriteData.flipped) image = image.flop().rotate(90);

    await image.toFile(outputImage);
  }

  private async _getSprite(input: {
    spriteSheetRefabPath: string;
    spriteNameOrIndex: string | number;
    outputImage: string;
  }) {
    const { spriteSheetRefabPath, spriteNameOrIndex, outputImage } = input;
    const { spriteData, texturePath } = this._spriteRepository.getSprite(
      { $$scriptPath: spriteSheetRefabPath },
      spriteNameOrIndex
    );
    if (!spriteData?.name) {
      throw new Error(
        `Sprite ${chalk.green(spriteNameOrIndex)} not found. Script path: ${chalk.green(spriteSheetRefabPath)}`
      );
    }

    const debug = true;
    if (debug) {
      await this._generateSpriteImage(texturePath, spriteData, outputImage);
    }

    return {
      spriteData: { ...spriteData, name: spriteData.name },
      texturePath: normalizePath(path.relative(OUTPUT_ROOT, this.toOutputPath(texturePath))),
    };
  }

  async getSprite(
    spriteCollectionRef: { $$scriptPath: string },
    spriteNameOrIndex: string | number,
    outputImage: string
  ) {
    return this._getSprite({
      spriteSheetRefabPath: spriteCollectionRef.$$scriptPath,
      spriteNameOrIndex,
      outputImage,
    });
  }

  async getSpriteFromAmmononicon(spriteNameOrIndex: string | number, outputImage: string) {
    return this._getSprite({
      spriteSheetRefabPath: SpriteRepository.AMMONONICON_SPRITE_PATH,
      spriteNameOrIndex,
      outputImage,
    });
  }

  toOutputPath(spritesheetPath: string) {
    const baseName = path.basename(spritesheetPath);
    const dirName = path.dirname(spritesheetPath);
    const nearestFolder = path.basename(dirName);
    return path.join(OUTPUT_ROOT, "spritesheet", `${nearestFolder}/${baseName}`.replaceAll(" ", "_"));
  }

  async saveSpritesheets() {
    await mkdir(path.join(OUTPUT_ROOT, "spritesheet"), { recursive: true });

    for (const file of this._spriteRepository.searchFiles) {
      const texturePath = this._spriteRepository.getSpriteTexturePath(file);
      if (!texturePath) {
        throw new Error(`Texture path not found for sprite collection: ${chalk.green(file)}`);
      }
      await cp(texturePath, this.toOutputPath(texturePath));
    }
  }
}
