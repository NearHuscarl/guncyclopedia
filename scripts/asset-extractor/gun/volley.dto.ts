import z from "zod/v4";
import { BinaryOption } from "../utils/schema.ts";
import { ProjectileModule } from "./gun.dto.ts";

export const VolleyDto = z.object({
  $$id: z.string(),
  m_Name: z.string(),
  projectiles: z.array(ProjectileModule),
  /**
   * Should projectile module have different levels based on certain condition.
   *
   * For example:
   * - Rad Gun: Each timely reload upgrades the projectile module to the next tier.
   * - Polaris: Killing enough enemies causes the gun to level up, and switch to the next projectile module.
   */
  ModulesAreTiers: BinaryOption,
});

export type TVolleyDto = z.input<typeof VolleyDto>;
