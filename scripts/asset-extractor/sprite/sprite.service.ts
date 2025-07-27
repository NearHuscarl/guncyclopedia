import path from "node:path";
import { cp, mkdir } from "node:fs/promises";
import sharp from "sharp";
import chalk from "chalk";
import { SpriteRepository } from "./sprite.repository.ts";
import { DATA_PATH, PUBLIC_PATH } from "../constants.ts";
import { normalizePath } from "../utils/path.ts";
import type { TGunDto } from "../gun/gun.dto.ts";
import type { TSpriteCollectionDto } from "./sprite.dto.ts";

export class SpriteService {
  private static readonly _DEBUG_OUTPUT_PATH = path.join(DATA_PATH, "debug/guns");
  private readonly _spriteRepository: SpriteRepository;
  private readonly _debug = true;

  private constructor(spriteRepository: SpriteRepository) {
    this._spriteRepository = spriteRepository;
  }
  static async create(spriteRepository: SpriteRepository) {
    await mkdir(SpriteService._DEBUG_OUTPUT_PATH, { recursive: true });
    return new SpriteService(spriteRepository);
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
    gunDto: TGunDto;
  }) {
    const { spriteSheetRefabPath, spriteNameOrIndex, gunDto } = input;

    const { spriteData, texturePath } = this._spriteRepository.getSprite(
      { $$scriptPath: spriteSheetRefabPath },
      spriteNameOrIndex
    );
    if (!spriteData?.name) {
      throw new Error(
        `Sprite ${chalk.green(spriteNameOrIndex)} not found. Script path: ${chalk.green(spriteSheetRefabPath)}`
      );
    }

    if (this._debug) {
      const imageOutputPath = path.join(
        SpriteService._DEBUG_OUTPUT_PATH,
        typeof spriteNameOrIndex === "number"
          ? `${gunDto.gun.PickupObjectId}-${spriteNameOrIndex}.png`
          : `${gunDto.gun.PickupObjectId}.png`
      );
      await this._generateSpriteImage(texturePath, spriteData, imageOutputPath);
    }

    return {
      spriteData: { ...spriteData, name: spriteData.name },
      texturePath: normalizePath(path.relative(PUBLIC_PATH, this.toOutputPath(texturePath))),
    };
  }

  async getSprite(spriteCollectionRef: { $$scriptPath: string }, spriteNameOrIndex: string | number, gunDto: TGunDto) {
    return this._getSprite({
      spriteSheetRefabPath: spriteCollectionRef.$$scriptPath,
      spriteNameOrIndex,
      gunDto,
    });
  }

  async getSpriteFromAmmononicon(spriteNameOrIndex: string | number, gunDto: TGunDto) {
    return this._getSprite({
      spriteSheetRefabPath: SpriteRepository.AMMONONICON_SPRITE_PATH,
      spriteNameOrIndex,
      gunDto,
    });
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
