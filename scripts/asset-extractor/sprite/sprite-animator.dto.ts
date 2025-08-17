import z from "zod/v4";
import { AssetExternalReference } from "../utils/schema.ts";

export const WrapMode = {
  Loop: 0,
  LoopSection: 1,
  Once: 2,
  PingPong: 3,
  RandomFrame: 4,
  RandomLoop: 5,
  Single: 6,
  LoopFidget: 7,
} as const;

export const SpriteAnimatorDto = z.object({
  clips: z.array(
    z.object({
      name: z.string().nullable(),
      frames: z.array(
        z.object({
          $$texturePath: z.string(),
          spriteCollection: AssetExternalReference.required(),
          spriteId: z.number(),
        }),
      ),
      fps: z.number(),
      loopStart: z.number(),
      wrapMode: z.enum(WrapMode),
      minFidgetDuration: z.number(),
      maxFidgetDuration: z.number(),
    }),
  ),
});

export type TSpriteAnimatorDto = z.input<typeof SpriteAnimatorDto>;
