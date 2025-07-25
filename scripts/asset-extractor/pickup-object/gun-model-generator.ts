import chalk from "chalk";
import z from "zod/v4";
import invert from "lodash/invert.js";
import uniqBy from "lodash/uniqBy.js";
import countBy from "lodash/countBy.js";
import keyBy from "lodash/keyBy.js";
import isEqual from "lodash/isEqual.js";
import uniq from "lodash/uniq.js";
import cloneDeep from "lodash/cloneDeep.js";
import { GunClass, ItemQuality, ProjectileSequenceStyle, ShootStyle } from "../gun/gun.dto.ts";
import { videos } from "../gun/gun.meta.ts";
import { Gun } from "./pickup-object.model.ts";
import { TranslationRepository } from "../translation/translation.repository.ts";
import { GunRepository } from "../gun/gun.repository.ts";
import { ProjectileRepository } from "../gun/projectile.repository.ts";
import { applySpecialCases } from "./apply-special-cases.ts";
import { StatModifier } from "../player/player.dto.ts";
import { VolleyRepository } from "../gun/volley.repository.ts";
import type { TEnconterDatabase } from "../encouter-trackable/encounter-trackable.dto.ts";
import type { TGun, TProjectile, TProjectileMode, TProjectilePerShot } from "./pickup-object.model.ts";
import type { TGunDto, TProjectileModule } from "../gun/gun.dto.ts";
import type { TProjectileDto } from "../gun/projectile.dto.ts";
import type { TVolleyDto } from "../gun/volley.dto.ts";

const gunQualityTextLookup = invert(ItemQuality);
const gunClassTextLookup = invert(GunClass);
const shootStyleTextLookup = invert(ShootStyle);
const modifyMethodTextLookup = invert(StatModifier.ModifyMethod);
const statTypeTextLookup = invert(StatModifier.StatType);

const unusedGunIds = new Set([
  // https://enterthegungeon.fandom.com/wiki/Black_Revolver
  405,
  // https://enterthegungeon.wiki.gg/wiki/Ice_Ogre_Head
  226,
  // https://enterthegungeon.fandom.com/wiki/Megaphone
  361,
  // https://enterthegungeon.fandom.com/wiki/Portaler
  391,
  // https://enterthegungeon.fandom.com/wiki/Gundertale
  509,
  // https://the-advanced-ammonomicon.fandom.com/wiki/Flamethrower
  46,
]);

type GunModelGeneratorCtor = {
  gunRepo: GunRepository;
  projectileRepo: ProjectileRepository;
  volleyRepo: VolleyRepository;
  translationRepo: TranslationRepository;
};

export class GunModelGenerator {
  private readonly _gunRepo: GunRepository;
  private readonly _projectileRepo: ProjectileRepository;
  private readonly _volleyRepo: VolleyRepository;
  private readonly _translationRepo: TranslationRepository;

  constructor({ gunRepo, projectileRepo, volleyRepo, translationRepo }: GunModelGeneratorCtor) {
    this._gunRepo = gunRepo;
    this._projectileRepo = projectileRepo;
    this._volleyRepo = volleyRepo;
    this._translationRepo = translationRepo;
  }

  private _getGunVolley(gunDto: TGunDto): TVolleyDto | undefined {
    if (!gunDto.rawVolley.guid) {
      return undefined;
    }

    const volleyDto = this._volleyRepo.getVolley(gunDto.rawVolley.guid);
    if (!volleyDto) {
      throw new Error(
        chalk.red(
          `Parsing ${gunDto.gunName} (${gunDto.PickupObjectId}) gun failed: Volley with guid ${gunDto.rawVolley.guid} not found in VolleyRepository.`
        )
      );
    }
    return volleyDto;
  }

  private _getProjectile(gunDto: TGunDto, guid: string) {
    const projDto = this._projectileRepo.getProjectile(guid);
    if (!projDto) {
      throw new Error(
        chalk.red(
          `Parsing ${gunDto.gunName} (${gunDto.PickupObjectId}) gun failed: Projectile with guid ${guid} not found in ProjectileRepository.`
        )
      );
    }
    return projDto;
  }

  private _buildProjectile(id: number, projDto: TProjectileDto): TProjectile {
    const proj: TProjectile = {
      id,
      name: projDto.$$name,
      damage: projDto.baseData.damage,
      speed: projDto.baseData.speed,
      range: projDto.baseData.range,
      force: projDto.baseData.force,
    };

    if (projDto.ignoreDamageCaps) proj.ignoreDamageCaps = true;
    if (projDto.AppliesPoison) proj.poisonChance = projDto.PoisonApplyChance;
    if (projDto.AppliesSpeedModifier) {
      // Some mistakes where AppliesSpeedModifier doesn't mean anything
      // ExportedProject\Assets\GameObject\Railgun_Variant_Projectile.prefab
      if (projDto.speedEffect.SpeedMultiplier < 1) {
        proj.speedChance = projDto.SpeedApplyChance;
      }
    }
    if (projDto.AppliesCharm) proj.charmChance = projDto.CharmApplyChance;
    if (projDto.AppliesFreeze) proj.freezeChance = projDto.FreezeApplyChance;
    if (projDto.AppliesFire) proj.fireChance = projDto.FireApplyChance;
    if (projDto.AppliesStun) proj.stunChance = projDto.StunApplyChance;
    if (projDto.AppliesCheese) proj.cheeseChance = projDto.CheeseApplyChance;

    return proj;
  }

  private _computeProjectileSpawnWeight(projectiles: TProjectile[]): TProjectile[] {
    const projectileCount = countBy(projectiles, (p) => p.id);
    const projectileLookup = keyBy(projectiles, (p) => p.id);
    const uniqProjectiles = Object.values(projectileLookup);

    if (uniqProjectiles.length === 1) {
      return uniqProjectiles;
    }

    return uniqProjectiles.map((p) => ({ ...p, spawnWeight: projectileCount[p.id] }));
  }

  private _buildModeFromProjectileModules(
    mode: string | number,
    gunDto: TGunDto,
    defaultModule: TProjectileModule,
    modules: TProjectileModule[]
  ): TProjectileMode {
    const projectilesPerShot: TProjectilePerShot[] = [];
    for (const module of modules) {
      let projectiles = module.projectiles
        .filter((p) => p.guid)
        .map((p) => this._buildProjectile(p.fileID, this._getProjectile(gunDto, p.guid!)));

      if (module.sequenceStyle === ProjectileSequenceStyle.Random) {
        projectiles = this._computeProjectileSpawnWeight(projectiles);
      } else {
        // TODO: handle other sequence styles
      }
      projectilesPerShot.push({
        shootStyle: shootStyleTextLookup[module.shootStyle] as keyof typeof ShootStyle,
        cooldownTime: module.cooldownTime,
        spread: module.angleVariance,
        projectiles,
      });

      // TODO: handle invert
      if (module.mirror) {
        projectilesPerShot.push(cloneDeep(projectilesPerShot.at(-1)!));
      }
    }
    const chargeTime = typeof mode === "number" ? mode : undefined;
    return {
      mode: typeof mode === "number" ? `Charge ${mode}` : mode,
      magazineSize: defaultModule.numberOfShotsInClip,
      chargeTime,
      projectiles: projectilesPerShot,
    };
  }

  private _buildProjectileModes(gunDto: TGunDto): TProjectileMode[] {
    const volleyDto = this._getGunVolley(gunDto);
    const modulesAreTiers = Boolean(volleyDto?.ModulesAreTiers);
    const projectileModules = volleyDto ? volleyDto.projectiles : [gunDto.singleModule];

    // see Gun.cs#DefaultModule. Some attributes within the module like numberOfShotsInClip/shootingStyle
    // should be tied to a gun, not the projectile data. DefaultModule is used to retrieve those attributes
    // for the gun model
    const defaultModule = projectileModules[0];

    // each module is a separate mode
    if (modulesAreTiers) {
      const modePrefix = gunDto.LocalActiveReload ? "Reload - " : "";
      return projectileModules.map((mod, i) =>
        this._buildModeFromProjectileModules(`${modePrefix}lvl ${i + 1}`, gunDto, defaultModule, [mod])
      );
    }

    // TODO: handle fucking Starpew volley
    const chargeModulesLookup = new Map<number, TProjectileModule[]>();
    const normalModules: TProjectileModule[] = [];
    for (const module of projectileModules) {
      if (module.shootStyle !== ShootStyle.Charged) {
        normalModules.push(module);
        continue;
      }

      const uniqChargeTimes = new Set(module.chargeProjectiles.map((p) => p.ChargeTime));
      if (uniqChargeTimes.size < module.chargeProjectiles.length) {
        throw new Error(
          `${gunDto.gunName}, A projectile module must not have multiple projectiles with the same charge time. This is undefined behavior`
        );
      }

      for (const { ChargeTime, Projectile } of module.chargeProjectiles) {
        if (!Projectile.guid) continue;
        if (!chargeModulesLookup.get(ChargeTime)) chargeModulesLookup.set(ChargeTime, []);

        const chargeModules = chargeModulesLookup.get(ChargeTime)!;
        const clonedModule = cloneDeep(module);
        clonedModule.projectiles = [cloneDeep(Projectile)];
        clonedModule.chargeProjectiles = [];
        chargeModules.push(clonedModule);
      }
    }
    const res: TProjectileMode[] = [];
    // TODO: bounce bullets
    // TODO: piecing bullets
    // TODO: round that has explosion on impact count as another source of damage
    // TODO: homing bullet
    // TODO: link 2 guns (e.g. Gungeon Ant)
    // TODO: invert bullet (check Directional Pad)

    // // TODO: test casey's case again
    // // skip duplicates. Multiple charge projectiles with the same stats can be defined for the visual effect purpose.
    // // See ExportedProject/Assets/GameObject/Baseball_Bat_Gun.prefab
    // const entries = Array.from(chargeModes.entries());
    // for (let i = 0; i < entries.length - 1; i++) {
    //   const [, mode] = entries[i];
    //   let j = i + 1;
    //   while (j < entries.length && isEqual(entries[j][1]?.projectiles, mode?.projectiles)) {
    //     chargeModes.delete(entries[j][0]);
    //     j++;
    //   }
    // }

    if (normalModules.length > 0) {
      res.push(this._buildModeFromProjectileModules("Default", gunDto, defaultModule, normalModules));
    }
    for (const [chargeTime, modules] of chargeModulesLookup.entries()) {
      res.push(this._buildModeFromProjectileModules(chargeTime, gunDto, defaultModule, modules));
    }

    return res;
  }

  async generate(entry: TEnconterDatabase["Entries"][number]) {
    try {
      if (unusedGunIds.has(entry.pickupObjectId)) {
        return;
      }

      const texts = {
        name: this._translationRepo.getItemTranslation(entry.journalData.PrimaryDisplayName ?? ""),
        quote: this._translationRepo.getItemTranslation(entry.journalData.NotificationPanelDescription ?? ""),
        description: this._translationRepo.getItemTranslation(entry.journalData.AmmonomiconFullEntry ?? ""),
      };

      const gunDto = this._gunRepo.getGun(entry.pickupObjectId);
      if (!gunDto) {
        console.warn(chalk.yellow(`Gun with ID ${entry.pickupObjectId} (${texts.name}) not found in GunRepository.`));
        return;
      }

      const featureFlags: TGun["featureFlags"] = [];

      if (entry.isInfiniteAmmoGun) featureFlags.push("hasInfiniteAmmo");
      if (entry.doesntDamageSecretWalls) featureFlags.push("doesntDamageSecretWalls");
      if (gunDto.reflectDuringReload) featureFlags.push("reflectDuringReload");
      if (gunDto.LocalActiveReload) featureFlags.push("activeReload");
      if (gunDto.blankDuringReload) featureFlags.push("blankDuringReload");
      if (gunDto.rawVolley.guid && this._volleyRepo.getVolley(gunDto.rawVolley.guid)?.ModulesAreTiers)
        featureFlags.push("hasTieredProjectiles");

      const allStatModifiers = gunDto.currentGunStatModifiers.concat(gunDto.passiveStatModifiers ?? []);

      if (gunDto.UsesBossDamageModifier === 1) {
        allStatModifiers.push({
          statToBoost: StatModifier.StatType.DamageToBosses,
          modifyType: StatModifier.ModifyMethod.MULTIPLICATIVE,
          amount: gunDto.CustomBossDamageModifier >= 0 ? gunDto.CustomBossDamageModifier : 0.8,
        });
      }

      return Gun.parse(
        applySpecialCases({
          ...texts,
          type: "gun",
          id: entry.pickupObjectId,
          gunNameInternal: gunDto.gunName,
          quality: gunQualityTextLookup[gunDto.quality] as keyof typeof ItemQuality,
          gunClass: gunClassTextLookup[gunDto.gunClass] as keyof typeof GunClass,
          playerStatModifiers: allStatModifiers.map((m) => ({
            statToBoost: statTypeTextLookup[m.statToBoost],
            modifyType: modifyMethodTextLookup[m.modifyType] as keyof typeof StatModifier.ModifyMethod,
            amount: m.amount,
          })),
          maxAmmo: gunDto.maxAmmo,
          reloadTime: gunDto.reloadTime,
          featureFlags,
          projectileModes: this._buildProjectileModes(gunDto),
          blankReloadRadius: gunDto.blankDuringReload ? gunDto.blankReloadRadius : undefined,
          video: videos.has(entry.pickupObjectId) ? videos.get(entry.pickupObjectId) : undefined,
        })
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(chalk.red(`Error parsing GUN pickup-object with ID ${entry.pickupObjectId}:`));
        console.error(z.prettifyError(error));
      }
      throw error;
    }
  }
}
