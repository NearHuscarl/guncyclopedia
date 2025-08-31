import z from "zod/v4";
import memoize from "lodash/memoize";
import pickupObjects from "../generated/data/pickup-objects.json";
import projectileLookup from "../generated/data/projectiles.json";
import { isGun } from "../generated/helpers/types";
import { GunFromStorage, ProjectileMode, ProjectileModule } from "../generated/models/gun.model";
import { Projectile, ProjectileFromStorage } from "../generated/models/projectile.model";
import type { TGun } from "../generated/models/gun.model";
import type { TPickupObject } from "../generated/models/pickup-object.model";
import type { TProjectile, TProjectileId } from "../generated/models/projectile.model";

export const ResolvedProjectile = Projectile.extend({
  spawnedBy: z.string().optional(),
  spawnLevel: z.number().optional(),
});

export type TResolvedProjectile = z.infer<typeof ResolvedProjectile>;

/**
 * Aggregated data for front-end usage.
 */
export const ResolvedProjectileModule = ProjectileModule.extend({
  projectiles: z.array(ResolvedProjectile),
});

export type TResolvedProjectileModule = z.infer<typeof ResolvedProjectileModule>;

/**
 * Aggregated data for front-end usage.
 */
export const ResolvedProjectileMode = ProjectileMode.extend({
  volley: z.array(ResolvedProjectileModule),
});
export type TResolvedProjectileMode = z.infer<typeof ResolvedProjectileMode>;

export class GameObjectService {
  static getPickupObjects = (): TPickupObject[] => {
    return pickupObjects as TPickupObject[];
  };

  static getGuns = memoize((): TGun[] => {
    return this.getPickupObjects()
      .filter(isGun)
      .map((p) => GunFromStorage.parse(p));
  });

  static _projectileLookup: Record<TProjectileId, TProjectile> = GameObjectService.initProjectiles();

  static initProjectiles() {
    const projectiles: Record<TProjectileId, TProjectile> = {};
    for (const projectile of Object.values(projectileLookup)) {
      projectiles[projectile.id] = ProjectileFromStorage.parse(projectile);
    }
    return projectiles;
  }

  static getProjectile(projectileId: TProjectileId): TProjectile {
    return GameObjectService._projectileLookup[projectileId];
  }
}
