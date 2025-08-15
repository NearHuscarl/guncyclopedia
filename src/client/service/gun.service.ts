import sumBy from "lodash/sumBy";
import startCase from "lodash/startCase";
import type { TGun, TProjectile, TProjectileMode, TProjectilePerShot } from "../generated/models/gun.model";
import { ProjectileService, type TRangeLabel } from "./projectile.service";
import { formatNumber } from "@/lib/lang";

interface IStat {
  total: number;
  base: number;
  details: {
    source: string;
    value: number;
  }[];
}

export type TGunStats = {
  dps: IStat;
  damage: IStat;
  precision: number;
  range: TRangeLabel;
  maxAmmo: number;
  shootStyle: TProjectilePerShot["shootStyle"];
  magazineSize: number;
  reloadTime: number;
  fireRate: number;
  mode: TProjectileMode;
  projectilePerShot: TProjectilePerShot;
  projectile: TProjectile;
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
    const { source, damage } = additionalDamage;

    if (source === "ricochet") {
      const { numberOfBounces, chanceToDieOnBounce, damageMultiplierOnBounce } = projectileData;
      return [
        `Potential damage from ricochets: <strong>${formatNumber(damage, 2)}</strong><br />`,
        `- numberOfBounces: <strong>${formatNumber(numberOfBounces ?? 0, 2)}</strong><br />`,
        (chanceToDieOnBounce ?? 0) > 0 &&
          `- chanceToDieOnBounce: <strong>${formatNumber(chanceToDieOnBounce ?? 0, 2)}</strong><br />`,
        damageMultiplierOnBounce !== 1 &&
          `- damageMultiplierOnBounce: <strong>${formatNumber(damageMultiplierOnBounce ?? 1, 2)}</strong>`,
      ]
        .filter(Boolean)
        .join("\n");
    } else if (source === "blackhole") {
      return `Black hole center: <strong>${formatNumber(damage, 2)}</strong>`;
    }
    return `${startCase(source)} damage: <strong>${formatNumber(damage, 2)}</strong>`;
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
      base: baseDamage,
      total: baseDamage + sumBy(extraDamage, "damage"),
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

  static computeGunStats(
    gun: TGun,
    modeIndex: number,
    projectileIndex: number,
    projectileDataIndex: number,
  ): TGunStats {
    const mode = gun.projectileModes[modeIndex] ?? gun.projectileModes[0];
    const projectile =
      mode.projectiles[projectileIndex] ?? ProjectileService.createAggregatedProjectile(mode.projectiles);
    const projectilePool = projectile.projectiles;
    const projData =
      mode.projectiles[projectileIndex]?.projectiles[projectileDataIndex] ??
      ProjectileService.createAggregatedProjectileData(projectilePool, "avg");
    const magazineSize = mode.magazineSize === -1 ? gun.maxAmmo : mode.magazineSize;
    const reloadTime = magazineSize === gun.maxAmmo ? 0 : gun.reloadTime;
    const maxAmmo = gun.featureFlags.includes("hasInfiniteAmmo") ? Infinity : gun.maxAmmo;
    const shotsPerSecond = GunService.getEstimatedShotsPerSecond({
      reloadTime: gun.reloadTime, // Prize Pistol's edge case (only 1 max ammo)
      magazineSize,
      projectile,
      chargeTime: mode.chargeTime,
    });
    const dps = this.getDamage(projData, "dps", shotsPerSecond);
    const damage = this.getDamage(projData, "instant", shotsPerSecond);

    return {
      maxAmmo,
      magazineSize,
      reloadTime,
      shootStyle: projectile.shootStyle, // only raiden coil has 2 shoot styles.
      precision: ProjectileService.toPrecision(projectile.spread),
      fireRate: shotsPerSecond * 60,
      range: ProjectileService.getRangeLabel(projData),
      dps: {
        details: dps.segments,
        total: dps.total,
        base: dps.base,
      },
      damage: {
        details: damage.segments,
        total: damage.total,
        base: damage.base,
      },
      mode,
      projectilePerShot: projectile,
      projectile: projData,
    };
  }
}
