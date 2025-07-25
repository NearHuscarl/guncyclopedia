import z from "zod/v4";

export const PickupObject = z.object({
  id: z.number(),
  name: z.string(),
  quote: z.string(),
  description: z.string(),
  type: z.enum(["gun", "item"]),
});

export type TPickupObject = z.input<typeof PickupObject>;
