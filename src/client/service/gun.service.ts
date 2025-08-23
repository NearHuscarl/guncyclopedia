import sumBy from "lodash/sumBy";
import startCase from "lodash/startCase";
import { ProjectileService, type TRangeLabel } from "./projectile.service";
import { formatNumber } from "@/lib/lang";
import type { TGun, TProjectileMode, TProjectilePerShot } from "../generated/models/gun.model";
import type { TProjectile } from "../generated/models/projectile.model";

interface IStat {
  total: number;
  base: number;
  details: {
    source: string;
    value: number;
    isEstimated?: boolean;
  }[];
}

export type TGunStats = {
  dps: IStat;
  damage: IStat;
  force: IStat;
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
  static getTimeBetweenShot(input: {
    reloadTime: number;
    magazineSize: number;
    projectile: TProjectilePerShot;
    chargeTime?: number;
  }) {
    const { magazineSize, projectile, chargeTime } = input;
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
    return timeBetweenShots;
  }

  /**
   * `ExportedProject\Assets\Scripts\Assembly-CSharp\ProjectileModule.cs#GetEstimatedShotsPerSecond`
   */
  static getEstimatedShotsPerSecond(input: {
    reloadTime: number;
    magazineSize: number;
    projectile: TProjectilePerShot;
    chargeTime?: number;
  }) {
    const { reloadTime, magazineSize } = input;
    let timeBetweenShots = this.getTimeBetweenShot(input);

    if (magazineSize > 0) {
      timeBetweenShots += reloadTime / magazineSize;
    }
    return 1 / timeBetweenShots;
  }

  private static _getTooltip(additionalDamage: IStat["details"][number], projectileData: TProjectile) {
    const { source, value } = additionalDamage;

    if (source === "ricochet") {
      const { numberOfBounces, chanceToDieOnBounce, damageMultiplierOnBounce } = projectileData;
      return [
        `Potential damage from ricochets: <strong>${formatNumber(value, 2)}</strong><br />`,
        `- numberOfBounces: <strong>${formatNumber(numberOfBounces ?? 0, 2)}</strong><br />`,
        (chanceToDieOnBounce ?? 0) > 0 &&
          `- chanceToDieOnBounce: <strong>${formatNumber(chanceToDieOnBounce ?? 0, 2)}</strong><br />`,
        damageMultiplierOnBounce !== 1 &&
          `- damageMultiplierOnBounce: <strong>${formatNumber(damageMultiplierOnBounce ?? 1, 2)}</strong>`,
      ]
        .filter(Boolean)
        .join("\n");
    } else if (source === "blackhole") {
      return `Black hole center: <strong>${formatNumber(value, 2)}</strong>`;
    } else if (source === "damageMultiplier") {
      return `Damage modifier: <strong>${formatNumber(value, 2)}</strong>`;
    }
    return `${startCase(source)} damage: <strong>${formatNumber(value, 2)}</strong>`;
  }

  static getDamage(
    projectileData: TProjectile,
    type: "dps" | "instant",
    shotsPerSecond: number,
    gun: TGun,
    reloadToFireRatio: number,
  ): IStat {
    const baseDamage = type === "dps" ? shotsPerSecond * projectileData.damage : projectileData.damage;
    const extraDamage: IStat["details"] = [];

    if (type === "dps") {
      for (const d of projectileData.additionalDamage) {
        if (d.type === "instant") {
          extraDamage.push({ ...d, value: d.damage * shotsPerSecond });
        } else if (d.type === "dps") {
          extraDamage.push({ ...d, value: d.damage });
        }
      }
    } else {
      for (const d of projectileData.additionalDamage) {
        if (d.type === "instant") {
          extraDamage.push({ ...d, value: d.damage });
        }
      }
    }

    for (const statModifier of gun.playerStatModifiers) {
      if (statModifier.statToBoost === "Damage") {
        extraDamage.push({ value: baseDamage * (statModifier.amount - 1), source: "damageMultiplier" });
      }
    }

    if (gun.attribute.auraOnReload) {
      extraDamage.push({ value: gun.attribute.auraOnReloadDps! * reloadToFireRatio, source: "Aura on reload" });
      if (gun.attribute.auraOnReloadIgniteDps) {
        extraDamage.push({
          value: gun.attribute.auraOnReloadIgniteDps * reloadToFireRatio,
          source: "Ignite aura on reload",
        });
      }
    }

    return {
      base: baseDamage,
      total: baseDamage + sumBy(extraDamage, "damage"),
      details: [
        {
          source: `Base damage: <strong>${formatNumber(baseDamage, 2)}</strong>`,
          value: baseDamage,
        },
        ...extraDamage.map((d) => ({ ...d, source: this._getTooltip(d, projectileData) })),
      ].sort((a, b) => Number(a.isEstimated ?? 0) - Number(b.isEstimated ?? 0)),
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
    const maxAmmo = gun.featureFlags.includes("hasInfiniteAmmo") ? 10_000 : gun.maxAmmo;
    const reloadTime = gun.reloadTime;
    const timingInput = {
      reloadTime: gun.reloadTime, // Prize Pistol's edge case (only 1 max ammo)
      magazineSize,
      projectile,
      chargeTime: mode.chargeTime,
    };
    const shotsPerSecond = GunService.getEstimatedShotsPerSecond(timingInput);
    const timeBetweenShots = GunService.getTimeBetweenShot(timingInput);
    const reloadToFireRatio = reloadTime / (reloadTime + timeBetweenShots * magazineSize);

    const dps = this.getDamage(projData, "dps", shotsPerSecond, gun, reloadToFireRatio);
    const damage = this.getDamage(projData, "instant", shotsPerSecond, gun, reloadToFireRatio);

    return {
      maxAmmo,
      magazineSize,
      reloadTime,
      shootStyle: projectile.shootStyle, // only raiden coil has 2 shoot styles.
      precision: ProjectileService.toPrecision(projectile.spread),
      fireRate: shotsPerSecond * 60,
      range: ProjectileService.getRangeLabel(projData),
      dps,
      damage,
      force: {
        details: [
          { source: `Base force: <strong>${projData.force}</strong>`, value: projData.force },
          ...(projData.explosionForce
            ? [
                {
                  source: `Explosion force: <strong>${projData.explosionForce}</strong>`,
                  value: projData.explosionForce,
                },
              ]
            : []),
        ],
        total: projData.force + (projData.explosionForce ?? 0),
        base: projData.force,
      },
      mode,
      projectilePerShot: projectile,
      projectile: projData,
    };
  }
}
