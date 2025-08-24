import path from "node:path";
import { cp, mkdir } from "node:fs/promises";
import sharp from "sharp";
import chalk from "chalk";
import { SpriteRepository } from "./sprite.repository.ts";
import { PUBLIC_PATH } from "../constants.ts";
import { normalizePath } from "../utils/path.ts";
import type { TSpriteCollectionDto } from "./sprite.dto.ts";

export class SpriteService {
  private readonly _spriteRepository: SpriteRepository;

  private constructor(spriteRepository: SpriteRepository) {
    this._spriteRepository = spriteRepository;
  }
  static async create(spriteRepository: SpriteRepository) {
    return new SpriteService(spriteRepository);
  }

  async getImage(texturePath: string, spriteData: TSpriteCollectionDto["spriteDefinitions"][number]) {
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

    return image;
  }

  getSprite(spriteSheetRefabPath: string, spriteNameOrIndex: string | number) {
    const { spriteData, texturePath } = this._spriteRepository.getSprite(
      { $$scriptPath: spriteSheetRefabPath },
      spriteNameOrIndex,
    );
    if (!spriteData?.name) {
      throw new Error(
        `Sprite ${chalk.green(spriteNameOrIndex)} not found. Script path: ${chalk.green(spriteSheetRefabPath)}`,
      );
    }

    return {
      spriteData: { ...spriteData, name: spriteData.name },
      texturePath: normalizePath(path.relative(PUBLIC_PATH, this.toOutputPath(texturePath))),
    };
  }

  async getSpriteImage(spriteSheetRefabPath: string, spriteNameOrIndex: string | number): Promise<sharp.Sharp> {
    const { spriteData, texturePath } = this._spriteRepository.getSprite(
      { $$scriptPath: spriteSheetRefabPath },
      spriteNameOrIndex,
    );
    if (!spriteData?.name) {
      throw new Error(
        `Sprite ${chalk.green(spriteNameOrIndex)} not found. Script path: ${chalk.green(spriteSheetRefabPath)}`,
      );
    }

    return this.getImage(texturePath, spriteData);
  }

  toOutputPath(spritesheetPath: string) {
    const baseName = path.basename(spritesheetPath);
    const dirName = path.dirname(spritesheetPath);
    const nearestFolder = path.basename(dirName);
    return path.join(PUBLIC_PATH, "spritesheet", `${nearestFolder}/${baseName}`.replaceAll(" ", "_"));
  }

  async saveSpritesheets() {
    await mkdir(path.join(PUBLIC_PATH, "spritesheet"), { recursive: true });

    for (const file of this._spriteRepository.searchFiles) {
      const texturePath = this._spriteRepository.getSpriteTexturePath(file);
      if (!texturePath) {
        throw new Error(`Texture path not found for sprite collection: ${chalk.green(file)}`);
      }
      await cp(texturePath, this.toOutputPath(texturePath));
    }
  }
}
