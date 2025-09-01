import startCase from "lodash/startCase";
import uniq from "lodash/uniq";
import groupBy from "lodash/groupBy";
import { ProjectileService, type TRangeLabel } from "./projectile.service";
import { formatNumber } from "@/lib/lang";
import { GameObjectService } from "./game-object.service";
import type { TGun, TProjectileMode, TProjectileModule } from "../generated/models/gun.model";
import type { TProjectile } from "../generated/models/projectile.model";
import type { TResolvedProjectile, TResolvedProjectileMode, TResolvedProjectileModule } from "./game-object.service";

export const HomingLevel = {
  None: -1,
  Pathetic: 0,
  Weak: 1,
  Strong: 2,
  AutoAim: 3,
} as const;

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
  shootStyle: TProjectileModule["shootStyle"];
  magazineSize: number;
  reloadTime: number;
  fireRate: number;
  mode: TResolvedProjectileMode;
  projectileModule: TResolvedProjectileModule;
  projectile: TProjectile;
};

export class GunService {
  static getTimeBetweenShot(input: {
    reloadTime: number;
    magazineSize: number;
    module: TResolvedProjectileModule;
    chargeTime?: number;
  }) {
    const { magazineSize, module, chargeTime } = input;
    const { shootStyle, cooldownTime, burstCooldownTime, burstShotCount } = module;
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

  static getHomingLevel(projectile: TProjectile) {
    if (!projectile.isHoming) return HomingLevel.None;

    // the angular velocity doesn't make it `HomingLevel.Strong`, but it slows down when not facing
    // the enemy, give it enough time to always adjust to the correct angle.
    if (projectile.isBeeLikeTargetBehavior) {
      return HomingLevel.Strong;
    }

    const { homingRadius = 0, homingAngularVelocity = 0 } = projectile;
    if (homingRadius <= 2 || homingAngularVelocity <= 80) {
      return HomingLevel.Pathetic;
    }

    if (homingRadius >= 50 && homingAngularVelocity >= 1000) {
      return HomingLevel.AutoAim;
    }

    if (homingRadius >= 25 && homingAngularVelocity >= 200) {
      return HomingLevel.Strong;
    }

    return HomingLevel.Weak;
  }

  /**
   * `ExportedProject/Assets/Scripts/Assembly-CSharp/ProjectileModule.cs#GetEstimatedShotsPerSecond`
   */
  static getEstimatedShotsPerSecond(input: {
    reloadTime: number;
    magazineSize: number;
    module: TResolvedProjectileModule;
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
      case "bee":
        return `Bee sting damage: {{VALUE}}`;
      default:
        return `${startCase(source)} damage: {{VALUE}}`;
    }
  }

  static computeDamage(input: {
    projectile: TProjectile;
    type: "dps" | "instant";
    shotsPerSecond: number;
    gun: TGun;
    reloadToFireRatio: number;
    resolvedVolley: TResolvedProjectileModule[];
    selectSpecificProjectile: boolean;
  }): IStat {
    const { projectile, type, shotsPerSecond, gun, reloadToFireRatio, resolvedVolley, selectSpecificProjectile } =
      input;
    const baseDamage = type === "dps" ? shotsPerSecond * projectile.damage : projectile.damage;
    const extraDamage: IStat["details"] = [];
    let effectiveDamage = baseDamage;
    let isExplosiveProj = false;

    for (const d of projectile.additionalDamage) {
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
        tooltip: this._getDamageTooltip(d.source, projectile),
      });
    }

    for (const statModifier of gun.playerStatModifiers) {
      if (statModifier.statToBoost === "Damage") {
        effectiveDamage = baseDamage * (statModifier.amount - 1);
        extraDamage.push({
          value: effectiveDamage,
          tooltip: this._getDamageTooltip("damageMultiplier", projectile),
        });
      }
    }

    if (projectile.penetration) {
      let penetration = Math.min(projectile.penetration, 3); // unlikely to hit more than 3 enemies at once.
      if (projectile.numberOfBounces && projectile.numberOfBounces > 1) {
        penetration += Math.min(projectile.numberOfBounces, 3); // more chance if it's bouncy idk
      }
      if (GunService.getHomingLevel(projectile) >= HomingLevel.Weak) {
        penetration++; // even more chance if it's homing hah
      }
      if (isExplosiveProj) {
        penetration = 0; // piercing only affects objects
      }
      penetration = Math.min(penetration, projectile.penetration);
      extraDamage.push({
        value: effectiveDamage * penetration,
        isEstimated: true,
        chance: 0,
        tooltip:
          "Estimated piercing damage: {{VALUE}}.<br/>Having bounce and homing modifiers help increase this damage.",
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

    const spawnedModules = resolvedVolley.filter((m) => m.projectiles[0].spawnedBy);
    if (spawnedModules.length > 0 && !selectSpecificProjectile) {
      const spawnHierarchy = groupBy(spawnedModules, (m) => m.projectiles[0].spawnLevel);

      for (const [_level, modules] of Object.entries(spawnHierarchy)) {
        const spawnedProjectile = ProjectileService.createAggregatedVolley(modules, true).projectiles[0];
        const { damage } = spawnedProjectile;
        const isEstimated = this.getHomingLevel(spawnedProjectile) <= HomingLevel.Weak;
        const spawner = GameObjectService.getProjectile(spawnedProjectile.spawnedBy!);
        const shotPerSecond2 = spawner.spawnProjectilesInflight
          ? spawner.spawnProjectilesInflightPerSecond!
          : shotsPerSecond;

        extraDamage.push({
          value: type === "dps" ? damage * shotPerSecond2 : damage,
          isEstimated,
          tooltip: `Damage from spawned projectile {{P:${modules[0].projectiles[0].id}}}: {{VALUE}}`,
        });

        const explosionDmg = spawnedProjectile.additionalDamage.find((d) => d.source === "explosion");
        if (explosionDmg) {
          extraDamage.push({
            value: explosionDmg.damage,
            isEstimated: isEstimated,
            chance: explosionDmg.damageChance,
            tooltip: `Explosion damage from spawned projectile {{P:${modules[0].projectiles[0].id}}}: {{VALUE}}`,
          });
        }
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

  /**
   * Move childless projectiles before spawning projectiles, then sort by spawn level. For diplaying on the UI.
   */
  static getSortWeight(p: TResolvedProjectile): number {
    if (!p.spawnProjectile && !p.spawnedBy) return -1;
    return (p.spawnLevel ?? 0) + 1;
  }

  /**
   * Return an array of projectile and all of the spawned projectiles recursively. Otherwise
   * return an array with  just the original projectile.
   */
  static resolveProjectile(p: TProjectile, depth = 0): TResolvedProjectile[] {
    if (!p.spawnProjectile) {
      return [p];
    }
    const p2: TResolvedProjectile = {
      ...GameObjectService.getProjectile(p.spawnProjectile),
      spawnedBy: p.id,
      spawnLevel: depth + 1,
    };
    return [p, p2, ...this.resolveProjectile(p2, depth + 1).slice(1)];
  }

  static resolveMode(mode: TProjectileMode): TResolvedProjectileMode {
    return {
      ...mode,
      volley: mode.volley
        .map((module) => {
          const projectiles: TResolvedProjectile[] = uniq(module.projectiles).map(GameObjectService.getProjectile);
          const spawnedModules: TResolvedProjectileModule[] = [];

          for (const p of projectiles) {
            const pp = this.resolveProjectile(p);

            for (const p2 of pp) {
              if (!p2.spawnedBy) continue;
              const spawner = GameObjectService.getProjectile(p2.spawnedBy);
              const spawnerCount = spawnedModules
                .flatMap((m) => m.projectiles)
                .concat(projectiles[0]) // the original spawner
                .filter((p) => p.id === p2.spawnedBy).length;

              const spawnCount = (spawner.spawnProjectileMaxNumber ?? spawner.spawnProjectileNumber!) * spawnerCount;
              for (let i = 0; i < spawnCount; i++) {
                // spawned projectile is considered part of a volley, just a bit more delay than the spawner
                spawnedModules.push({ ...module, projectiles: [p2] });
              }
            }
          }

          return [{ ...module, projectiles }, ...spawnedModules];
        })
        .flat()
        .sort((a, b) => this.getSortWeight(a.projectiles[0]) - this.getSortWeight(b.projectiles[0])),
    };
  }

  static computeGunStats(gun: TGun, modeIndex: number, moduleIndex: number, projectileIndex: number): TGunStats {
    const selectSpecificProjectile = moduleIndex !== -1 || projectileIndex !== -1;
    const mode = this.resolveMode(gun.projectileModes[modeIndex] ?? gun.projectileModes[0]);
    const module =
      mode.volley[moduleIndex] ?? ProjectileService.createAggregatedVolley(mode.volley, selectSpecificProjectile);
    const projectilePool = module.projectiles;
    const projectile =
      mode.volley[moduleIndex]?.projectiles[projectileIndex] ??
      ProjectileService.createAggregatedProjectile(projectilePool, "random");
    const magazineSize = mode.magazineSize === -1 ? gun.maxAmmo : Math.ceil(mode.magazineSize / (module.ammoCost ?? 1));
    const maxAmmo = gun.featureFlags.includes("hasInfiniteAmmo") ? ProjectileService.MAX_MAX_AMMO : gun.maxAmmo;
    const reloadTime = gun.reloadTime;
    const timingInput = {
      reloadTime: gun.reloadTime, // Prize Pistol's edge case (only 1 max ammo)
      magazineSize,
      module,
      chargeTime: mode.chargeTime,
    };
    const shotsPerSecond = this.getEstimatedShotsPerSecond(timingInput);
    const timeBetweenShots = this.getTimeBetweenShot(timingInput);
    const reloadToFireRatio = reloadTime / (reloadTime + timeBetweenShots * magazineSize);

    const dmgCalculationInput = {
      projectile,
      shotsPerSecond,
      gun,
      reloadToFireRatio,
      resolvedVolley: mode.volley,
      selectSpecificProjectile,
    };
    const dps = this.computeDamage({ ...dmgCalculationInput, type: "dps" });
    const damage = this.computeDamage({ ...dmgCalculationInput, type: "instant" });
    const fireRate = module.shootStyle === "Beam" ? ProjectileService.MAX_FIRE_RATE : shotsPerSecond * 60;

    let aggregatedProjectileIncludingChildren: TResolvedProjectile | undefined;
    if (!selectSpecificProjectile) {
      // the original projectile doesn't aggregate any spawned projectiles' data so the damage can be calculated
      // later as a separate segment, but it would miss other aggregate attributes like bouncing/homing which
      // is re-evaluated here.
      aggregatedProjectileIncludingChildren = ProjectileService.createAggregatedVolley(mode.volley, true)
        .projectiles[0];
    }

    return {
      maxAmmo,
      magazineSize,
      reloadTime,
      shootStyle: module.shootStyle, // only raiden coil has 2 shoot styles, no need to aggregate.
      precision: ProjectileService.toPrecision(module.spread),
      fireRate,
      range: ProjectileService.getRangeLabel(projectile),
      dps,
      damage,
      force: this.getForce(projectile),
      mode,
      projectileModule: module,
      projectile: aggregatedProjectileIncludingChildren ?? projectile,
    };
  }
}
