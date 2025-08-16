import z from "zod/v4";
import { Gun, ProjectilePerShot } from "@/client/generated/models/gun.model";
import { RangeLabel } from "@/client/service/projectile.service";

export const SearchParams = z.object({
  debug: z.boolean().optional(),
  selectedId: z.number().int().nonnegative().optional(),
  isComparisonMode: z.boolean().optional(),
  sortBy: z.enum(["none", "quality", "maxAmmo", "cooldownTime"]).optional(),
  filter: z
    .object({
      feature: Gun.shape.featureFlags.element.optional(),
      range: RangeLabel.optional(),
      gunClass: Gun.shape.gunClass.optional(),
      shootStyle: ProjectilePerShot.shape.shootStyle.optional(),
      quality: Gun.shape.quality.optional(),
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
    })
    .optional(),
});

export type TSearchParams = z.infer<typeof SearchParams>;
