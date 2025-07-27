import z from "zod/v4";
import { AssetExternalReference } from "../utils/schema.ts";

export const SpriteAnimatorDto = z.object({
  $$texturePath: z.string(),
  clips: z.array(
    z.object({
      name: z.string().nullable(),
      frames: z.array(
        z.object({
          spriteCollection: AssetExternalReference.required(),
          spriteId: z.number(),
        })
      ),
      fps: z.number(),
      loopStart: z.number(),
    })
  ),
});

export type TSpriteAnimatorDto = z.input<typeof SpriteAnimatorDto>;
