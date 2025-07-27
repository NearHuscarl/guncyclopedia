import z from "zod/v4";
import { AssetExternalReference, BinaryOption, Position } from "../utils/schema.ts";

export const SpriteCollectionDto = z.object({
  $$texturePath: z.string(),
  spriteDefinitions: z.array(
    z.object({
      // some sprite data are missing the name! But we keep them because sprite can be accessed by ID
      name: z.string().nullable(),
      uvs: z.tuple([Position, Position, Position, Position]),
      material: AssetExternalReference.required(),
      flipped: BinaryOption,
    })
  ),
});

export type TSpriteCollectionDto = z.input<typeof SpriteCollectionDto>;
