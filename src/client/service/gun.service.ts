import z from "zod/v4";
import startCase from "lodash/startCase";
import uniq from "lodash/uniq";
import groupBy from "lodash/groupBy";
import keyBy from "lodash/keyBy";
import countBy from "lodash/countBy";
import { HomingLevel, ProjectileService, RangeLabel, type TRangeLabel } from "./projectile.service";
import { formatNumber, inverseLerp, lerp } from "@/lib/lang";
import {
  GameObjectService,
  ResolvedProjectile,
  ResolvedProjectileMode,
  ResolvedProjectileModule,
} from "./game-object.service";
import { ProjectileModule } from "../generated/models/gun.model";
import type {
  TResolvedDamageDetail,
  TResolvedProjectile,
  TResolvedProjectileMode,
  TResolvedProjectileModule,
} from "./game-object.service";
import type { TGun, TProjectileMode, TProjectileModule, TShootStyle } from "../generated/models/gun.model";
import type { TDamageDetail, TProjectile, TProjectileId } from "../generated/models/projectile.model";

interface IStat {
  base: number;
  details: {
    tooltip: string;
    value: number;
    chance?: number;
    isEstimated?: boolean;
  }[];
}

export const Stat = z.object({
  base: z.number(),
  details: z.array(
    z.object({
      tooltip: z.string(),
      value: z.number(),
      chance: z.number().optional(),
      isEstimated: z.boolean().optional(),
    }),
  ),
}) satisfies z.ZodType<IStat>;

export type TGunStats = {
  id: number;
  dps: IStat;
  damage: IStat;
  force: IStat;
  precision: number;
  range: TRangeLabel;
  maxAmmo: number;
  shootStyle: TShootStyle;
  magazineSize: number;
  reloadTime: number;
  fireRate: number;
  mode: TResolvedProjectileMode;
  projectileModule: TResolvedProjectileModule;
  projectile: TResolvedProjectile;
};

type TTimingInput = {
  shootStyle: TShootStyle;
  magazineSize: number;
  reloadTime: number;
  chargeTime?: number;
  cooldownTime: number;
  burstCooldownTime: number;
  burstShotCount: number;
};

export const GunStats = z.object({
  id: z.number(),
  dps: Stat,
  damage: Stat,
  force: Stat,
  precision: z.number(),
  range: RangeLabel,
  maxAmmo: z.number(),
  shootStyle: ProjectileModule.shape.shootStyle,
  magazineSize: z.number(),
  reloadTime: z.number(),
  fireRate: z.number(),
  mode: ResolvedProjectileMode,
  projectileModule: ResolvedProjectileModule,
  projectile: ResolvedProjectile,
}) satisfies z.ZodType<TGunStats>;

export class GunService {
  static hasChargeMode(gun: TGun) {
    return gun.projectileModes.at(-1)?.mode.startsWith("Charge");
  }

  static getMagSize(magazineSize: number, module: TProjectileModule | TResolvedProjectileModule) {
    return module.depleteAmmo ? 1 : magazineSize;
  }

  static getTimeBetweenShot(input: TTimingInput) {
    const { magazineSize, chargeTime, shootStyle, cooldownTime, burstCooldownTime, burstShotCount } = input;
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
   * `ExportedProject/Assets/Scripts/Assembly-CSharp/ProjectileModule.cs#GetEstimatedShotsPerSecond`
   */
  static getEstimatedShotsPerSecond(input: TTimingInput) {
    if (input.shootStyle === "Beam") {
      return 1; // all beam projectiles' damage = dps
    }

    const { reloadTime, magazineSize } = input;
    let timeBetweenShots = this.getTimeBetweenShot(input);

    if (magazineSize > 0) {
      timeBetweenShots += reloadTime / magazineSize;
    }
    return 1 / timeBetweenShots;
  }

  static aggregateVolley(
    volley: TResolvedProjectileModule[],
    allowSpawnedModules: boolean,
    magazineSize: number,
  ): TResolvedProjectileModule {
    const filterModule = (m: TResolvedProjectileModule) => allowSpawnedModules || !m.projectiles[0].spawnedBy;

    if (volley.filter(filterModule).length === 0) {
      throw new Error("Cannot compute average projectile from an empty list.");
    }

    const finalVolley: TResolvedProjectileModule = {
      cooldownTime: 0,
      spread: 0,
      burstShotCount: volley[0].burstShotCount,
      burstCooldownTime: volley[0].burstCooldownTime,
      shootStyle: volley[0].shootStyle,
      depleteAmmo: false,
      ammoCost: Infinity,
      timeBetweenShots: Infinity,
      shotsPerSecond: 0,
      projectiles: [],
      finalProjectiles: [],
      finalProjectileCount: 0,
    };
    for (const module of volley) {
      finalVolley.cooldownTime = Math.max(finalVolley.cooldownTime, module.cooldownTime);
      finalVolley.spread = Math.max(finalVolley.spread, module.spread);
      finalVolley.ammoCost = Math.min(finalVolley.ammoCost ?? 1, module.ammoCost ?? 1);
      finalVolley.depleteAmmo = finalVolley.depleteAmmo || module.depleteAmmo;
      finalVolley.finalProjectileCount = Math.max(
        finalVolley.finalProjectileCount ?? 0,
        module.finalProjectileCount ?? 0,
      );

      if (!filterModule(module)) continue;

      finalVolley.timeBetweenShots = Math.min(finalVolley.timeBetweenShots, module.timeBetweenShots);
      finalVolley.shotsPerSecond = Math.max(finalVolley.shotsPerSecond, module.shotsPerSecond);

      const projectile = ProjectileService.aggregateProjectile(module.projectiles, "random");

      if (module.finalProjectiles.length > 0) {
        const finalProjectileCount = module.finalProjectileCount ?? 1;
        const normalProjectile: TResolvedProjectile = {
          ...projectile,
          spawnWeight: magazineSize - finalProjectileCount,
        };
        const finalProjectile = ProjectileService.aggregateProjectile(module.finalProjectiles, "volley"); // final projectiles are either single or with spawned projectiles
        if (finalProjectile.damage > normalProjectile.damage) finalProjectile.isFinalBuff = true;
        else finalProjectile.isFinalDebuff = true;
        finalVolley.finalProjectiles.push(...module.finalProjectiles);
        finalVolley.projectiles.push(
          ProjectileService.aggregateProjectile([normalProjectile, finalProjectile], "random"),
        );
      } else {
        finalVolley.projectiles.push(projectile);
      }
    }

    finalVolley.projectiles = [ProjectileService.aggregateProjectile(finalVolley.projectiles, "volley")];

    if (finalVolley.finalProjectiles.length === 0) {
      delete finalVolley.finalProjectileCount;
    }

    return finalVolley;
  }

  private static _getDamageTooltip(source: TDamageDetail["source"], projectile: TResolvedProjectile) {
    if (import.meta.env["MODE"] === "test") {
      return source;
    }
    switch (source) {
      case "ricochet": {
        const { numberOfBounces, chanceToDieOnBounce, damageMultiplierOnBounce } = projectile;
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
      case "pierce":
        return "Estimated piercing damage: {{VALUE}}<br/>Having bounce and homing modifiers help increase this damage.";
      case "damageAllEnemies":
        return "Estimated damage to all enemies: {{VALUE}}<br/>Assuming 4 enemies in range on average.";
      case "wish":
        return `Estimated damage from genie punch after <strong>${projectile.wishesToBuff}</strong> hits: {{VALUE}}`;
      default:
        return `${startCase(source)} damage: {{VALUE}}`;
    }
  }

  static computeDamage(input: {
    module: TResolvedProjectileModule;
    projectile: TResolvedProjectile;
    magazineSize: number;
    type: "dps" | "instant";
    gun: TGun;
    resolvedVolley: TResolvedProjectileModule[];
    selectSpecificProjectile: boolean;
  }): IStat {
    const { module, projectile, magazineSize, type, gun, resolvedVolley, selectSpecificProjectile } = input;
    let baseDamage = type === "dps" ? projectile.dps : projectile.damage;
    const extraDamage: IStat["details"] = [];

    // directional pad, face melter.
    if ((gun.id === 514 || gun.id === 149) && !selectSpecificProjectile) {
      extraDamage.push({
        value: (baseDamage * 3) / 4,
        tooltip: "Damage from 3 other directions: {{VALUE}}",
        isEstimated: true,
      });
      baseDamage /= 4;
    }

    let effectiveDamage = baseDamage;

    for (const d of projectile.additionalDamage) {
      const value = type === "dps" ? d.dps : d.damage;
      if (!value) continue;

      extraDamage.push({
        value,
        isEstimated: d.isEstimated,
        chance: d.damageChance,
        tooltip: this._getDamageTooltip(d.source, projectile),
      });
    }

    // TODO: put into ProjectileService?
    for (const statModifier of gun.playerStatModifiers) {
      if (statModifier.statToBoost === "Damage") {
        effectiveDamage = baseDamage * (statModifier.amount - 1);
        extraDamage.push({
          value: effectiveDamage,
          tooltip: this._getDamageTooltip("damageMultiplier", projectile),
        });
      }
    }

    if (type === "dps") {
      if (gun.attribute.lifeOrb) {
        const avgEnemyHealth = 20;
        const timeToKillAvgEnemyPerSecond = avgEnemyHealth / projectile.dps;
        const avgEnemyCountInRoom = 4;
        extraDamage.push({
          value: (avgEnemyHealth * avgEnemyCountInRoom) / timeToKillAvgEnemyPerSecond,
          isEstimated: true,
          chance: 0.65,
          tooltip:
            "Estimated soul damage: {{VALUE}}<br/>Assuming <strong>4</strong> enemies in range on average, and the last enemy killed has <strong>20</strong> health.",
        });
      }

      if (gun.attribute.auraOnReload) {
        const reloadToFireRatio = gun.reloadTime / (gun.reloadTime + module.timeBetweenShots * magazineSize);

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
    }

    const spawnedModules = resolvedVolley.filter((m) => m.projectiles[0].spawnedBy);
    if (spawnedModules.length > 0 && !selectSpecificProjectile) {
      const spawnHierarchy = groupBy(spawnedModules, (m) => m.projectiles[0].spawnLevel);

      for (const [_level, modules] of Object.entries(spawnHierarchy)) {
        const spawnedProjectile = GunService.aggregateVolley(modules, true, magazineSize).projectiles[0];
        const { damage } = spawnedProjectile;
        const isEstimated =
          ProjectileService.getHomingLevel(spawnedProjectile) <= HomingLevel.Weak &&
          !spawnedProjectile.damageAllEnemies;
        const spawner = GameObjectService.getProjectile(spawnedProjectile.spawnedBy!);
        const shotPerSecond2 = spawner.spawnProjectilesInflight
          ? spawner.spawnProjectilesInflightPerSecond!
          : module.shotsPerSecond;

        extraDamage.push({
          value: type === "dps" ? damage * shotPerSecond2 : damage,
          isEstimated,
          tooltip: `Damage from spawned projectile {{P:${modules[0].projectiles[0].id}}}: {{VALUE}}`,
        });

        if (spawnedProjectile.explosionRadius) {
          const explosionDmg = spawnedProjectile.additionalDamage.find((d) => d.source === "explosion");
          if (explosionDmg) {
            extraDamage.push({
              value: type === "dps" ? explosionDmg.dps : explosionDmg.damage!,
              isEstimated: isEstimated,
              chance: explosionDmg.damageChance,
              tooltip: `Explosion damage from spawned projectile {{P:${modules[0].projectiles[0].id}}}: {{VALUE}}`,
            });
          }
        }
        if (spawnedProjectile.damageAllEnemies) {
          const damageAllEnemiesDmg = spawnedProjectile.additionalDamage.find((d) => d.source === "damageAllEnemies");
          if (damageAllEnemiesDmg) {
            extraDamage.push({
              value: type === "dps" ? damageAllEnemiesDmg.dps : damageAllEnemiesDmg.damage!,
              isEstimated: true,
              chance: damageAllEnemiesDmg.damageChance,
              tooltip: `Estimated damage to all enemies from spawned projectile: {{VALUE}}.<br/>Assuming 4 enemies in range on average.`,
            });
          }
        }
      }
    }

    extraDamage.sort((a, b) => {
      let r;
      r = Number(a.isEstimated ?? 0) - Number(b.isEstimated ?? 0);
      if (r !== 0) return r;
      r = a.chance ?? 1 - (b.chance ?? 1);
      if (r !== 0) return r;
      r = a.value - b.value; // smaller value first or they could be cropped if the total value is too big.
      return r;
    });

    return {
      base: baseDamage,
      details: [{ tooltip: `Base damage: {{VALUE}}`, value: baseDamage }, ...extraDamage],
    };
  }

  static getForce(projectile: TResolvedProjectile): IStat {
    const details: IStat["details"] = [{ tooltip: `Base force: {{VALUE}}`, value: projectile.force ?? 0 }];

    if (projectile.explosionForce) {
      details.push({ tooltip: `Explosion force: {{VALUE}}`, value: projectile.explosionForce });
    }
    if (projectile.wishesToBuff) {
      details.push({
        tooltip: `Genie punch force: {{VALUE}}`,
        chance: 0.4,
        isEstimated: true,
        value: 100 /* ExportedProject/Assets/Scripts/Assembly-CSharp/ThreeWishesBuff.cs#DelayedDamage() */,
      });
    }

    return { base: projectile.force ?? 0, details };
  }

  static GunResolver = class {
    static resolveAdditionalDamage(
      projectile: TProjectile,
      shotsPerSecond: number,
      timingInput: TTimingInput,
    ): TResolvedDamageDetail[] {
      const additionalDamage = projectile.additionalDamage;
      const resolved: TResolvedDamageDetail[] = [];
      const additionalDamageLookup: { [key in TDamageDetail["source"]]?: TDamageDetail } = keyBy(
        additionalDamage,
        "source",
      );

      for (const d of additionalDamage) {
        const { type, ...rest } = d;
        if (type === "dps") {
          resolved.push({ ...rest, dps: d.damage, damage: 0 });
        } else {
          resolved.push({ ...rest, dps: d.damage * shotsPerSecond });
        }
      }

      // apply additional damage from existing projectile fields
      if (projectile.penetration) {
        let penetration = Math.min(projectile.penetration, 3); // unlikely to hit more than 3 enemies at once.
        if (projectile.numberOfBounces && projectile.numberOfBounces > 1) {
          penetration += Math.min(projectile.numberOfBounces, 3); // more chance if it's bouncy idk
        }
        if (ProjectileService.getHomingLevel(projectile) >= HomingLevel.Weak) {
          penetration++; // even more chance if it's homing hah
        }
        if (additionalDamageLookup.explosion) {
          penetration = 0; // piercing only affects objects
        }
        penetration = Math.min(penetration, projectile.penetration);

        const damage = projectile.damage * penetration;
        if (damage > 0) {
          resolved.push({
            source: "pierce",
            damage,
            dps: damage * shotsPerSecond,
            isEstimated: true,
          });
        }
      }

      if (projectile.wishesToBuff && projectile.wishesBuffDamageDealt) {
        resolved.push({
          source: "wish",
          isEstimated: true,
          damageChance: 0.4,
          damage: projectile.wishesBuffDamageDealt,
          dps: (projectile.wishesBuffDamageDealt * shotsPerSecond) / projectile.wishesToBuff,
        });
      }

      if (projectile.linkMaxDistance && projectile.linkDamagePerHit) {
        const linksPerSecond = GunService.getEstimatedShotsPerSecond({
          ...timingInput,
          // n projectiles create n-1 links
          magazineSize: timingInput.magazineSize - 1,
        });
        const distanceFactor = inverseLerp(7, 18, projectile.linkMaxDistance);
        resolved.push({
          source: "link",
          isEstimated: true,
          damageChance: lerp(0.35, 0.65, distanceFactor),
          damage: projectile.linkDamagePerHit,
          dps: projectile.linkDamagePerHit * linksPerSecond,
        });
      }

      return resolved;
    }

    /**
     * Return an array of projectile and all of the spawned projectiles recursively. Otherwise
     * return an array with just the original projectile.
     */
    static resolveProjectile(
      id: TProjectileId,
      shotsPerSecond: number,
      timingInput: TTimingInput,
      depth = 0,
    ): TResolvedProjectile[] {
      const projectile = GameObjectService.getProjectile(id);
      const resolvedProjectile = {
        ...projectile,
        dps: projectile.damage * shotsPerSecond,
        additionalDamage: this.resolveAdditionalDamage(projectile, shotsPerSecond, timingInput),
      };

      if (!resolvedProjectile.spawnProjectile) {
        return [resolvedProjectile];
      }
      const spawnedProjectile = GameObjectService.getProjectile(resolvedProjectile.spawnProjectile);
      const rp2: TResolvedProjectile = {
        ...spawnedProjectile,
        additionalDamage: this.resolveAdditionalDamage(spawnedProjectile, shotsPerSecond, timingInput),
        spawnedBy: resolvedProjectile.id,
        spawnLevel: depth + 1,
        dps: spawnedProjectile.damage * shotsPerSecond,
      };

      return [
        resolvedProjectile,
        rp2,
        ...this.resolveProjectile(rp2.id, shotsPerSecond, timingInput, depth + 1).slice(1),
      ];
    }

    /**
     * Move childless projectiles before spawning projectiles, then sort by spawn level. For diplaying on the UI.
     */
    static getSortWeight(p: TResolvedProjectile): number {
      if (!p.spawnProjectile && !p.spawnedBy) return -1;
      return (p.spawnLevel ?? 0) + 1;
    }

    static resolveModule(
      module: TProjectileModule,
      gunInput: { reloadTime: number; chargeTime?: number; magazineSize: number },
    ): TResolvedProjectileModule[] {
      const timingInput: TTimingInput = {
        shootStyle: module.shootStyle,
        magazineSize: GunService.getMagSize(gunInput.magazineSize, module),
        reloadTime: gunInput.reloadTime,
        chargeTime: gunInput.chargeTime,
        cooldownTime: module.cooldownTime,
        burstCooldownTime: module.burstCooldownTime,
        burstShotCount: module.burstShotCount,
      };
      const shotsPerSecond = GunService.getEstimatedShotsPerSecond(timingInput);
      const timeBetweenShots = GunService.getTimeBetweenShot(timingInput);
      const spawnedModules: TResolvedProjectileModule[] = [];
      const resolvedModule: TResolvedProjectileModule = {
        ...module,
        ammoCost: module.ammoCost ?? 1,
        timeBetweenShots,
        shotsPerSecond,
        projectiles: [],
        finalProjectiles: [],
      };

      const projectileIds = uniq(module.projectiles);
      const pCountLookup = countBy(projectileIds, (p) => p);

      for (const id of projectileIds) {
        const pp = this.resolveProjectile(id, shotsPerSecond, timingInput);

        for (const p2 of pp) {
          if (!p2.spawnedBy) {
            resolvedModule.projectiles.push(p2);
            continue;
          }
          const spawner = GameObjectService.getProjectile(p2.spawnedBy);
          const spawnerCount = pCountLookup[p2.spawnedBy];
          const spawnCount = (spawner.spawnProjectileMaxNumber ?? spawner.spawnProjectileNumber!) * spawnerCount;
          for (let i = 0; i < spawnCount; i++) {
            // spawned projectile is considered part of a volley, just a bit more delay than the spawner
            spawnedModules.push({ ...resolvedModule, projectiles: [p2] });
          }
          pCountLookup[p2.id] = spawnCount;
        }
      }

      if (module.finalProjectile) {
        const pp = this.resolveProjectile(module.finalProjectile, shotsPerSecond, timingInput);
        const pCountLookup = { [module.finalProjectile]: 1 };

        for (const p2 of pp) {
          if (!p2.spawnedBy) {
            resolvedModule.finalProjectiles.push(p2);
            continue;
          }
          const spawner = GameObjectService.getProjectile(p2.spawnedBy);
          const spawnerCount = pCountLookup[p2.spawnedBy];
          const spawnCount = (spawner.spawnProjectileMaxNumber ?? spawner.spawnProjectileNumber!) * spawnerCount;

          for (let i = 0; i < spawnCount; i++) {
            // spawned projectile is considered part of a volley, just a bit more delay than the spawner
            resolvedModule.finalProjectiles.push({ ...p2 });
          }
          pCountLookup[p2.id] = spawnCount;
        }
        for (const p of resolvedModule.finalProjectiles) {
          p.spawnWeight = module.finalProjectileCount ?? 1;
          if (p.damage > resolvedModule.projectiles[0].damage) p.isFinalBuff = true;
          else p.isFinalDebuff = true;
        }
      }

      return [resolvedModule, ...spawnedModules];
    }

    static resolveMode(
      mode: TProjectileMode,
      gunInput: { reloadTime: number; chargeTime?: number; magazineSize: number },
    ): TResolvedProjectileMode {
      const resolvedVolley: TResolvedProjectileModule[] = [];

      for (const module of mode.volley) {
        resolvedVolley.push(...this.resolveModule(module, gunInput));
      }

      resolvedVolley.sort((a, b) => this.getSortWeight(a.projectiles[0]) - this.getSortWeight(b.projectiles[0]));

      return { ...mode, volley: resolvedVolley };
    }
  };

  static getMaxAmmo(gun: TGun, modeIndex: number) {
    if (gun.featureFlags.includes("hasInfiniteAmmo")) {
      return ProjectileService.MAX_MAX_AMMO;
    }

    return gun.projectileModes[modeIndex]?.maxAmmo ?? gun.maxAmmo;
  }

  static computeGunStats(
    gun: TGun,
    modeIndex: number,
    moduleIndex: number,
    projectileIndex: number,
    finalProjectileIndex = -1,
  ): TGunStats {
    const selectSpecificProjectile = moduleIndex !== -1 || projectileIndex !== -1;
    const maxAmmo = this.getMaxAmmo(gun, modeIndex);
    const reloadTime = gun.reloadTime;
    const modeInput = gun.projectileModes[modeIndex] ?? gun.projectileModes[0];
    const timingInput = { reloadTime, chargeTime: modeInput.chargeTime, magazineSize: modeInput.magazineSize };
    const mode = this.GunResolver.resolveMode(modeInput, timingInput);
    const module =
      mode.volley[moduleIndex] ?? this.aggregateVolley(mode.volley, selectSpecificProjectile, modeInput.magazineSize);
    const projectile =
      mode.volley[moduleIndex]?.finalProjectiles[finalProjectileIndex] ??
      mode.volley[moduleIndex]?.projectiles[projectileIndex] ??
      ProjectileService.aggregateProjectile(module.projectiles, "random");

    const dmgCalculationInput = {
      module,
      projectile,
      magazineSize: mode.magazineSize,
      gun,
      resolvedVolley: mode.volley,
      selectSpecificProjectile,
    };
    const dps = this.computeDamage({ ...dmgCalculationInput, type: "dps" });
    const damage = this.computeDamage({ ...dmgCalculationInput, type: "instant" });
    const fireRate = module.shootStyle === "Beam" ? ProjectileService.MAX_FIRE_RATE : module.shotsPerSecond * 60;

    let aggregatedProjectileIncludingChildren: TResolvedProjectile | undefined;
    if (!selectSpecificProjectile) {
      // the original projectile doesn't aggregate any spawned projectiles' data so the damage can be calculated
      // later as a separate segment, but it would miss other aggregate attributes like bouncing/homing which
      // is re-evaluated here.
      aggregatedProjectileIncludingChildren = this.aggregateVolley(mode.volley, true, modeInput.magazineSize)
        .projectiles[0];
    }

    return {
      id: gun.id,
      maxAmmo,
      magazineSize: this.getMagSize(mode.magazineSize, module),
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
