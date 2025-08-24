import z from "zod/v4";
import { AssetExternalReference } from "../utils/schema.ts";
import { MonoBehaviour } from "./asset.dto.ts";

export const RootGameObject = z.object({
  m_Component: z.array(z.object({ component: z.any() })),
  m_Name: z.string(),
});

export const SpriteData = MonoBehaviour.extend({
  collection: AssetExternalReference.required(),
  _spriteId: z.number().nonnegative(),
});

export const SpriteAnimatorData = MonoBehaviour.extend({
  library: AssetExternalReference.required(),
  defaultClipId: z.number().nonnegative(),
});

export type TRootGameObject = z.input<typeof RootGameObject>;
export type TSpriteData = z.input<typeof SpriteData>;
export type TSpriteAnimatorData = z.input<typeof SpriteAnimatorData>;
