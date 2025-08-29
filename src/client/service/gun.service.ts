import startCase from "lodash/startCase";
import { ProjectileService, type TRangeLabel } from "./projectile.service";
import { formatNumber } from "@/lib/lang";
import type { TGun, TProjectileMode, TProjectilePerShot } from "../generated/models/gun.model";
import type { TProjectile } from "../generated/models/projectile.model";

interface IStat {
  base: number;
  details: {
    tooltip: string;
    value: number;
    chance?: number;
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

  private static _getDamageTooltip(
    source: TProjectile["additionalDamage"][number]["source"],
    projectileData: TProjectile,
  ) {
    switch (source) {
      case "ricochet": {
        const { numberOfBounces, chanceToDieOnBounce, damageMultiplierOnBounce } = projectileData;
        return [
          `Potential damage from ricochets: {{VALUE}}<br />`,
          `- numberOfBounces: <strong>${formatNumber(numberOfBounces ?? 0, 2)}</strong><br />`,
          (chanceToDieOnBounce ?? 0) > 0 &&
            `- chanceToDieOnBounce: <strong>${formatNumber(chanceToDieOnBounce ?? 0, 2)}</strong><br />`,
          damageMultiplierOnBounce !== 1 &&
            `- damageMultiplierOnBounce: <strong>${formatNumber(damageMultiplierOnBounce ?? 1, 2)}</strong>`,
        ]
          .filter(Boolean)
          .join("\n");
      }
      case "blackhole":
        return `Black hole center: {{VALUE}}`;
      case "damageMultiplier":
        return `Damage modifier: {{VALUE}}`;
      case "devolver":
        return `Devolver's max potential damage: {{VALUE}}`;
      default:
        return `${startCase(source)} damage: {{VALUE}}`;
    }
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
    let effectiveDamage = baseDamage;
    let isExplosiveProj = false;

    for (const d of projectileData.additionalDamage) {
      let value = 0;
      if (type === "dps") {
        value = d.type === "instant" ? d.damage * shotsPerSecond : d.damage;
      } else if (type === "instant" && d.type === "instant") {
        value = d.damage;
      }

      if (!value) continue;

      if (d.source === "explosion") isExplosiveProj = true;
      extraDamage.push({
        value,
        isEstimated: d.isEstimated,
        chance: d.damageChance,
        tooltip: this._getDamageTooltip(d.source, projectileData),
      });
    }

    for (const statModifier of gun.playerStatModifiers) {
      if (statModifier.statToBoost === "Damage") {
        effectiveDamage = baseDamage * (statModifier.amount - 1);
        extraDamage.push({
          value: effectiveDamage,
          tooltip: this._getDamageTooltip("damageMultiplier", projectileData),
        });
      }
    }

    if (projectileData.penetration) {
      let penetration = Math.min(projectileData.penetration, 3); // unlikely to hit more than 3 enemies at once.
      if (projectileData.numberOfBounces && projectileData.numberOfBounces > 1) {
        penetration += Math.min(projectileData.numberOfBounces, 3); // more chance if it's bouncy idk
      }
      if (projectileData.isHoming && (projectileData.homingRadius === undefined || projectileData.homingRadius > 8)) {
        penetration++; // even more chance if it's homing hah
      }
      if (isExplosiveProj) {
        penetration = 0; // piercing only affects objects
      }
      penetration = Math.min(penetration, projectileData.penetration);
      extraDamage.push({
        value: effectiveDamage * penetration,
        isEstimated: true,
        chance: 0,
        tooltip:
          "Estimated damage from piercing: {{VALUE}}.<br/>Having bounce and homing modifiers help increase this damage.",
      });
    }

    if (gun.attribute.auraOnReload) {
      extraDamage.push({
        value: gun.attribute.auraOnReloadDps! * reloadToFireRatio,
        tooltip: "Aura on reload: {{VALUE}}",
      });
      if (gun.attribute.auraOnReloadIgniteDps) {
        extraDamage.push({
          value: gun.attribute.auraOnReloadIgniteDps * reloadToFireRatio,
          tooltip: "Aura on reload (ignite): {{VALUE}}",
        });
      }
    }

    return {
      base: baseDamage,
      details: [
        {
          tooltip: `Base damage: {{VALUE}}`,
          value: baseDamage,
        },
        ...extraDamage,
      ].sort((a, b) => Number(a.isEstimated ?? 0) - Number(b.isEstimated ?? 0)),
    };
  }

  static getForce(projectileData: TProjectile): IStat {
    return {
      base: projectileData.force,
      details: [
        { tooltip: `Base force: {{VALUE}}`, value: projectileData.force },
        ...(projectileData.explosionForce
          ? [{ tooltip: `Explosion force: {{VALUE}}`, value: projectileData.explosionForce }]
          : []),
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
      ProjectileService.createAggregatedProjectileData(projectilePool, "random");
    const magazineSize =
      mode.magazineSize === -1 ? gun.maxAmmo : Math.ceil(mode.magazineSize / (projectile.ammoCost ?? 1));
    const maxAmmo = gun.featureFlags.includes("hasInfiniteAmmo") ? ProjectileService.MAX_MAX_AMMO : gun.maxAmmo;
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
    const fireRate = projectile.shootStyle === "Beam" ? ProjectileService.MAX_FIRE_RATE : shotsPerSecond * 60;

    return {
      maxAmmo,
      magazineSize,
      reloadTime,
      shootStyle: projectile.shootStyle, // only raiden coil has 2 shoot styles, no need to aggregate.
      precision: ProjectileService.toPrecision(projectile.spread),
      fireRate,
      range: ProjectileService.getRangeLabel(projData),
      dps,
      damage,
      force: GunService.getForce(projData),
      mode,
      projectilePerShot: projectile,
      projectile: projData,
    };
  }
}
