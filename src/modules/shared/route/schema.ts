import z from "zod/v4";
import { Gun } from "@/client/generated/models/gun.model";

export const SearchParams = z.object({
  debug: z.boolean().optional(),
  selectedId: z.number().int().nonnegative().optional(),
  sortBy: z.enum(["none", "quality", "maxAmmo", "cooldownTime"]).optional(),
  filter: z
    .object({
      feature: Gun.shape.featureFlags.element.optional(),
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
    })
    .optional(),
});

export type TSearchParams = z.infer<typeof SearchParams>;
