import z from "zod/v4";
import { BinaryOption } from "../utils/schema.ts";
import { MonoBehaviour } from "../asset/asset.dto.ts";
import { EncounterTrackable, RootGameObject } from "../asset/component.dto.ts";

export const AiActorData = MonoBehaviour.extend({
  ActorName: z.string(),
  EnemyGuid: z.string(),
  DiesOnCollison: BinaryOption,
  CollisionDamage: z.number(),
});

export const EnemyDto = z.object({
  rootGameObject: RootGameObject,
  aiActor: AiActorData,
  encounterTrackable: EncounterTrackable.optional(),
});

export type TEnemyDto = z.input<typeof EnemyDto>;
export type TAiActorData = z.input<typeof AiActorData>;
