import z from "zod/v4";
import { PickupObject } from "./pickup-object.model.ts";

export const Item = PickupObject.extend({
  type: z.literal("item"),
  isPassive: z.boolean(),
});

export type TItem = z.input<typeof Item>;
