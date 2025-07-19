import z from "zod/v4";
import { BinaryOption } from "../utils/schema.ts";

export const EncounterDatabase = z.object({
  Entries: z.array(
    z.object({
      path: z.string(),
      pickupObjectId: z.number(),
      isPassiveItem: BinaryOption.optional(),
      isPlayerItem: BinaryOption,
      shootStyleInt: z.number(),
      doesntDamageSecretWalls: z.number(),
      isInfiniteAmmoGun: z.number(),
      journalData: z.object({
        PrimaryDisplayName: z.string().nullable(),
        NotificationPanelDescription: z.string().nullable(),
        AmmonomiconFullEntry: z.string().nullable(),
        IsEnemy: BinaryOption,
      }),
    })
  ),
});

export type TEnconterDatabase = z.input<typeof EncounterDatabase>;
