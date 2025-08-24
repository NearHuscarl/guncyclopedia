import z from "zod/v4";
import { Position } from "./schema.ts";

const Frame = z.object({
  flipped: z.boolean(),
  uvs: z.tuple([Position, Position, Position, Position]),
});

export const CompactedFrame = Frame.transform(({ flipped, uvs }) => {
  const [p1, p2, p3, p4] = uvs;
  return [p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y, flipped ? 1 : 0].join(",");
});

export const RichFrame = z.string().transform((s, ctx) => {
  const parts = s.split(",").map((t) => t.trim());
  if (parts.length !== 9) {
    ctx.addIssue({ code: "custom", message: "Expected 9 numbers (x1,y1,...,x4,y4,flip)." });
    return z.NEVER;
  }
  const nums = parts.map((n) => Number(n));
  if (nums.some((n) => Number.isNaN(n))) {
    ctx.addIssue({ code: "custom", message: "All values must be numbers." });
    return z.NEVER;
  }
  const [x1, y1, x2, y2, x3, y3, x4, y4, flip] = nums;
  if (flip !== 0 && flip !== 1) {
    ctx.addIssue({ code: "custom", message: "flip must be 0 or 1." });
    return z.NEVER;
  }
  return {
    flipped: flip === 1,
    uvs: [
      { x: x1, y: y1 },
      { x: x2, y: y2 },
      { x: x3, y: y3 },
      { x: x4, y: y4 },
    ],
  } as z.infer<typeof Frame>;
});

export const Animation = z.object({
  name: z.string(),
  fps: z.number(),
  rotate: z.union([z.literal(90), z.literal(180), z.literal(270), z.literal(360)]).optional(),
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
  frames: z.array(Frame),
});

export type TAnimation = z.infer<typeof Animation>;
