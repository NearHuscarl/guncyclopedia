import z from "zod/v4";
import { AssetExternalReference, BinaryOption } from "../utils/schema.ts";
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

export const JournalData = z.object({
  PrimaryDisplayName: z.string().nullable(),
  NotificationPanelDescription: z.string().nullable(),
  AmmonomiconFullEntry: z.string().nullable(),
  AmmonomiconSprite: z.string().nullable(),
  IsEnemy: BinaryOption,
});

export const EncounterTrackable = MonoBehaviour.extend({
  m_journalData: JournalData,
});

export type TRootGameObject = z.input<typeof RootGameObject>;
export type TSpriteData = z.input<typeof SpriteData>;
export type TSpriteAnimatorData = z.input<typeof SpriteAnimatorData>;
export type TEncounterTrackableData = z.input<typeof EncounterTrackable>;
export type TJournalData = z.input<typeof JournalData>;
