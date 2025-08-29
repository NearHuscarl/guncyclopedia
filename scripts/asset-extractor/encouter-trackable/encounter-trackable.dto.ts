import z from "zod/v4";
import { BinaryOption } from "../utils/schema.ts";
import { JournalData } from "../asset/component.dto.ts";

export const EncounterDatabase = z.object({
  Entries: z.array(
    z.object({
      path: z.string(),
      pickupObjectId: z.number(),
      isPassiveItem: BinaryOption,
      isPlayerItem: BinaryOption,
      shootStyleInt: z.number(),
      doesntDamageSecretWalls: z.number(),
      isInfiniteAmmoGun: z.number(),
      journalData: JournalData,
    }),
  ),
});

export type TEncounterDatabase = z.input<typeof EncounterDatabase>;
