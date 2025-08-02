import type { TGun, TProjectile, TProjectileMode, TProjectilePerShot } from "../generated/models/gun.model";
import { ProjectileService } from "./projectile.service";

type TGunStats = {
  dps: {
    current: number;
    aggregated: number;
  };
  magazineSize: number;
  shotsPerSecond: number;
  mode: TProjectileMode;
  projectilePerShot: {
    current: TProjectilePerShot;
    aggregated: TProjectilePerShot;
  };
  projectile: {
    current: TProjectile;
    aggregated: TProjectile;
  };
};

export class GunService {
  /**
   * `ExportedProject\Assets\Scripts\Assembly-CSharp\ProjectileModule.cs#GetEstimatedShotsPerSecond`
   */
  static getEstimatedShotsPerSecond(input: {
    reloadTime: number;
    magazineSize: number;
    projectile: TProjectilePerShot;
    chargeTime?: number;
  }) {
    const { reloadTime, magazineSize, projectile, chargeTime } = input;
    const { shootStyle, cooldownTime, burstCooldownTime, burstShotCount } = projectile;
    if (cooldownTime <= 0 && shootStyle !== "Charged") {
      return 0;
    }
    let timeBetweenShots = cooldownTime;
    if (shootStyle === "Burst" && burstShotCount > 1 && burstCooldownTime > 0) {
      const totalTimePerBurst = (burstShotCount - 1) * burstCooldownTime + cooldownTime;
      timeBetweenShots = totalTimePerBurst / burstShotCount;
    } else if (shootStyle === "Charged" && chargeTime) {
      timeBetweenShots = chargeTime;
    }
    if (magazineSize > 0) {
      if (magazineSize === 1) {
        timeBetweenShots = reloadTime / magazineSize;
      } else {
        timeBetweenShots += reloadTime / magazineSize;
      }
    }
    return 1 / timeBetweenShots;
  }

  static computeGunStats(gun: TGun, modeIndex: number, projectileIndex: number): TGunStats {
    const mode = gun.projectileModes[modeIndex] ?? gun.projectileModes[0];
    const aggregatedProjectile = ProjectileService.createAggregatedProjectile(mode.projectiles);
    const projectile = mode.projectiles[projectileIndex] ?? aggregatedProjectile;
    const projectilePool = projectile.projectiles;
    const projData = ProjectileService.createAggregatedProjectileData(projectilePool, "avg");
    const aggregatedProjData = aggregatedProjectile.projectiles[0];
    const magazineSize = mode.magazineSize === -1 ? gun.maxAmmo : mode.magazineSize;
    const shotsPerSecond = GunService.getEstimatedShotsPerSecond({
      reloadTime: gun.reloadTime,
      magazineSize,
      projectile,
      chargeTime: mode.chargeTime,
    });

    return {
      magazineSize,
      shotsPerSecond,
      dps: {
        current: shotsPerSecond * projData.damage,
        aggregated: shotsPerSecond * aggregatedProjData.damage,
      },
      mode,
      projectilePerShot: {
        aggregated: aggregatedProjectile,
        current: projectile,
      },
      projectile: {
        aggregated: aggregatedProjData,
        current: projData,
      },
    };
  }
}
