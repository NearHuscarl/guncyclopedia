import z from "zod/v4";
import { PlayerName } from "./player.model.ts";

export const PickupObject = z.object({
  id: z.number().int().nonnegative(),
  name: z.string(),
  quote: z.string(),
  description: z.string(),
  startingItemOf: z
    .array(PlayerName)
    .optional()
    .transform((arr) => (arr && arr.length === 0 ? undefined : arr)),
  startingAlternateItemOf: z
    .array(PlayerName)
    .optional()
    .transform((arr) => (arr && arr.length === 0 ? undefined : arr)),
  type: z.enum(["gun", "item"]),
});

export type TPickupObject = z.input<typeof PickupObject>;
