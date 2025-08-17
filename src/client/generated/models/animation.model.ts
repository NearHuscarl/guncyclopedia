import z from "zod/v4";
import { Position } from "./schema.ts";

export const Animation = z.object({
  name: z.string(),
  fps: z.number(),
  loopStart: z.number(),
  /**
   * Wrap mode for the animation.
   * - Loop: The animation loops indefinitely, starting from `0`, NOT `loopStart`.
   * - LoopFidget: The animation loops indefinitely, but wait for a random duration between `minFidgetDuration` and `maxFidgetDuration` before starting again.
   * - LoopSection: Play the 'intro' frames [0 ... loopStart-1] once, then loop only the section [loopStart ... last] forever.
   */
  wrapMode: z.enum(["Loop", "LoopSection", "Once", "PingPong", "RandomFrame", "RandomLoop", "Single", "LoopFidget"]),
  minFidgetDuration: z.number(),
  maxFidgetDuration: z.number(),
  texturePath: z.string(),
  frames: z.array(
    z.object({
      spriteName: z.string(),
      spriteId: z.number().min(-1),
      flipped: z.boolean(),
      uvs: z.tuple([Position, Position, Position, Position]),
    }),
  ),
});

export type TAnimation = z.infer<typeof Animation>;
