import sumBy from "lodash/sumBy";
import type { TGun, TProjectile, TProjectileMode, TProjectilePerShot } from "../generated/models/gun.model";
import { ProjectileService } from "./projectile.service";
import { formatNumber } from "@/lib/lang";

interface IStat {
  current: number;
  aggregated: number;
}

interface IComplextStat extends IStat {
  currentDetails: {
    source: string;
    value: number;
  }[];
}

type TGunStats = {
  dps: IComplextStat;
  damage: IComplextStat;
  precision: IStat;
  magazineSize: number;
  reloadTime: number;
  fireRate: number;
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
    let timeBetweenShots = magazineSize === 1 ? 0 : cooldownTime;
    if (shootStyle === "Burst" && burstShotCount > 1 && burstCooldownTime > 0) {
      const totalTimePerBurst = (burstShotCount - 1) * burstCooldownTime + cooldownTime;
      timeBetweenShots = totalTimePerBurst / burstShotCount;
    } else if (shootStyle === "Charged" && chargeTime) {
      timeBetweenShots += chargeTime;
    }
    if (magazineSize > 0) {
      timeBetweenShots += reloadTime / magazineSize;
    }
    return 1 / timeBetweenShots;
  }

  private static _getTooltip(additionalDamage: TProjectile["additionalDamage"][number], projectileData: TProjectile) {
    if (additionalDamage.source === "ricochet") {
      const { numberOfBounces, chanceToDieOnBounce, damageMultiplierOnBounce } = projectileData;
      return [
        `Potential damage from ricochets: <strong>${formatNumber(additionalDamage.damage, 2)}</strong><br />`,
        `- numberOfBounces: <strong>${formatNumber(numberOfBounces ?? 0, 2)}</strong><br />`,
        (chanceToDieOnBounce ?? 0) > 0 &&
          `- chanceToDieOnBounce: <strong>${formatNumber(chanceToDieOnBounce ?? 0, 2)}</strong><br />`,
        damageMultiplierOnBounce !== 1 &&
          `- damageMultiplierOnBounce: <strong>${formatNumber(damageMultiplierOnBounce ?? 1, 2)}</strong>`,
      ]
        .filter(Boolean)
        .join("\n");
    } else if (additionalDamage.source === "blackhole") {
      return `Black hole center: <strong>${formatNumber(additionalDamage.damage, 2)}</strong>`;
    }
    return "";
  }

  static getDamage(projectileData: TProjectile, type: "dps" | "instant", shotsPerSecond: number) {
    const baseDamage = type === "dps" ? shotsPerSecond * projectileData.damage : projectileData.damage;
    const extraDamage: TProjectile["additionalDamage"] = [];

    if (type === "dps") {
      for (const d of projectileData.additionalDamage) {
        if (d.type === "instant") {
          extraDamage.push({ ...d, damage: d.damage * shotsPerSecond });
        } else if (d.type === "dps") {
          extraDamage.push(d);
        }
      }
    } else {
      for (const d of projectileData.additionalDamage) {
        if (d.type === "instant") {
          extraDamage.push(d);
        }
      }
    }

    return {
      damage: baseDamage + sumBy(extraDamage, "value"),
      segments: [
        {
          source: `Base damage: <strong>${formatNumber(baseDamage, 2)}</strong>`,
          value: baseDamage,
        },
        ...extraDamage.map((dmg) => {
          const { isEstimated } = dmg;
          return { source: this._getTooltip(dmg, projectileData), value: dmg.damage, isEstimated };
        }),
      ],
    };
  }

  static computeGunStats(gun: TGun, modeIndex: number, projectileIndex: number): TGunStats {
    const mode = gun.projectileModes[modeIndex] ?? gun.projectileModes[0];
    const aggregatedProjectile = ProjectileService.createAggregatedProjectile(mode.projectiles);
    const projectile = mode.projectiles[projectileIndex] ?? aggregatedProjectile;
    const projectilePool = projectile.projectiles;
    const projData = ProjectileService.createAggregatedProjectileData(projectilePool, "avg");
    const aggregatedProjData = aggregatedProjectile.projectiles[0];
    const magazineSize = mode.magazineSize === -1 ? gun.maxAmmo : mode.magazineSize;
    const reloadTime = magazineSize === gun.maxAmmo ? 0 : gun.reloadTime;
    const shotsPerSecond = GunService.getEstimatedShotsPerSecond({
      reloadTime: gun.reloadTime, // Prize Pistol's edge case (only 1 max ammo)
      magazineSize,
      projectile,
      chargeTime: mode.chargeTime,
    });
    const dpsCurrent = this.getDamage(projData, "dps", shotsPerSecond);
    const dpsAggregated = this.getDamage(aggregatedProjData, "dps", shotsPerSecond);
    const dmgCurrent = this.getDamage(projData, "instant", shotsPerSecond);
    const dmgAggregated = this.getDamage(aggregatedProjData, "instant", shotsPerSecond);

    return {
      magazineSize,
      reloadTime,
      precision: {
        current: ProjectileService.toPrecision(projectile.spread),
        aggregated: ProjectileService.toPrecision(aggregatedProjectile.spread),
      },
      fireRate: shotsPerSecond * 60,
      dps: {
        currentDetails: dpsCurrent.segments,
        current: dpsCurrent.damage,
        aggregated: dpsAggregated.damage,
      },
      damage: {
        currentDetails: dmgCurrent.segments,
        current: dmgCurrent.damage,
        aggregated: dmgAggregated.damage,
      },
      mode,
      projectilePerShot: {
        current: projectile,
        aggregated: aggregatedProjectile,
      },
      projectile: {
        current: projData,
        aggregated: aggregatedProjData,
      },
    };
  }
}
