import z from "zod/v4";
import { AssetExternalReference } from "../utils/schema.ts";

export const SpriteData = z.object({
  collection: AssetExternalReference.required(),
  _spriteId: z.number().nonnegative(),
});

export const SpriteAnimatorData = z.object({
  library: AssetExternalReference.required(),
  defaultClipId: z.number().nonnegative(),
});

export type TSpriteData = z.input<typeof SpriteData>;
export type TSpriteAnimatorData = z.input<typeof SpriteAnimatorData>;
