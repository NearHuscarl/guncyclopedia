import chalk from "chalk";
import z from "zod/v4";
import invert from "lodash/invert.js";
import uniqBy from "lodash/uniqBy.js";
import countBy from "lodash/countBy.js";
import keyBy from "lodash/keyBy.js";
import { GunClass, ItemQuality, ProjectileSequenceStyle, ShootStyle } from "../gun/gun.dto.ts";
import { videos } from "../gun/gun.meta.ts";
import { Gun, ProjectileMode } from "./pickup-object.model.ts";
import { TranslationRepository } from "../translation/translation.repository.ts";
import { GunRepository } from "../gun/gun.repository.ts";
import { ProjectileRepository } from "../gun/projectile.repository.ts";
import type { TEnconterDatabase } from "../encouter-trackable/encounter-trackable.dto.ts";
import type { TGun, TProjectile, TProjectileMode } from "./pickup-object.model.ts";
import type { TGunDto } from "../gun/gun.dto.ts";
import type { TProjectileDto } from "../gun/projectile.dto.ts";
import { applySpecialCases } from "./apply-special-cases.ts";
import { StatModifier } from "../player/player.dto.ts";

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

function buildProjectile(id: number, projDto: TProjectileDto): TProjectile {
  const proj: TProjectile = {
    id,
    damage: projDto.baseData.damage,
    speed: projDto.baseData.speed,
    range: projDto.baseData.range,
    force: projDto.baseData.force,
  };

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

function computeProjectileSpawnWeight(projectiles: TProjectile[]): TProjectile[] {
  const projectileCount = countBy(projectiles, (p) => p.id);
  const projectileLookup = keyBy(projectiles, (p) => p.id);
  const uniqProjectiles = Object.values(projectileLookup);

  if (uniqProjectiles.length === 1) {
    return uniqProjectiles;
  }

  return uniqProjectiles.map((p) => ({ ...p, spawnWeight: projectileCount[p.id] }));
}

function buildProjectileModules(gunDto: TGunDto, projectileRepo: ProjectileRepository): TProjectileMode[] {
  const projectileModes: TProjectileMode[] = [];
  const getProjectile = (guid: string) => {
    const projDto = projectileRepo.getProjectile(guid);
    if (!projDto) {
      throw new Error(
        chalk.red(
          `Parsing ${gunDto.gunName} (${gunDto.PickupObjectId}) gun failed: Projectile with guid ${guid} not found in ProjectileRepository.`
        )
      );
    }
    return projDto;
  };

  if (gunDto.rawVolley.guid) {
    // TODO: handle rawVolley
  } else {
    const mod = gunDto.singleModule;

    if (mod.shootStyle === ShootStyle.Charged) {
      // skip duplicates. Multiple charge projectiles with the same stats can be defined for the visual effect purpose.
      // See ExportedProject\Assets\GameObject\Baseball_Bat_Gun.prefab
      const uniqChargeProjectiles = uniqBy(mod.chargeProjectiles, (p) => p.Projectile.fileID);
      const isMultiLevelCharge = uniqChargeProjectiles.filter((p) => p.ChargeTime > 0).length > 1;
      let chargeLvl = 0;

      for (let i = 0; i < uniqChargeProjectiles.length; i++) {
        const p = uniqChargeProjectiles[i];
        if (!p.Projectile.guid) continue;
        if (p.Projectile.fileID === 0) continue; // ChargeTime: 0 means no projectile fired until minimum charge time is reached
        if (p.Projectile.fileID === uniqChargeProjectiles[i + 1]?.Projectile.fileID) continue;

        const projDto = getProjectile(p.Projectile.guid);
        const isUncharged = i === 0 && uniqChargeProjectiles.length > 1 && p.ChargeTime === 0;

        // a charge should be an entire mode, not just a projectile
        projectileModes.push({
          name: isUncharged ? "Uncharged" : isMultiLevelCharge ? `Charged lvl ${++chargeLvl}` : "Charged",
          cooldownTime: mod.cooldownTime,
          shootStyle: shootStyleTextLookup[mod.shootStyle] as keyof typeof ShootStyle,
          magazineSize: mod.numberOfShotsInClip,
          spread: mod.angleVariance,
          chargeTime: p.ChargeTime,
          projectiles: [buildProjectile(p.Projectile.fileID, projDto)],
        });
      }
    } else {
      let projectiles = mod.projectiles
        .filter((p) => p.guid)
        .map((p) => buildProjectile(p.fileID, getProjectile(p.guid!)));

      if (mod.sequenceStyle === ProjectileSequenceStyle.Random) {
        projectiles = computeProjectileSpawnWeight(projectiles);
      }

      projectileModes.push({
        name: "Default",
        shootStyle: shootStyleTextLookup[mod.shootStyle] as keyof typeof ShootStyle,
        cooldownTime: mod.cooldownTime,
        magazineSize: mod.numberOfShotsInClip,
        spread: mod.angleVariance,
        projectiles,
      });
    }
  }

  return projectileModes.map((m) => ProjectileMode.parse(m));
}

type TBuildGunModelInput = {
  entry: TEnconterDatabase["Entries"][number];
  translationRepo: TranslationRepository;
  gunRepo: GunRepository;
  projectileRepo: ProjectileRepository;
};

export function buildGunModel({
  entry,
  translationRepo,
  gunRepo,
  projectileRepo,
}: TBuildGunModelInput): TGun | undefined {
  try {
    if (unusedGunIds.has(entry.pickupObjectId)) {
      return;
    }

    const texts = {
      name: translationRepo.getItemTranslation(entry.journalData.PrimaryDisplayName ?? ""),
      quote: translationRepo.getItemTranslation(entry.journalData.NotificationPanelDescription ?? ""),
      description: translationRepo.getItemTranslation(entry.journalData.AmmonomiconFullEntry ?? ""),
    };

    const gunDto = gunRepo.getGun(entry.pickupObjectId);
    if (!gunDto) {
      console.warn(chalk.yellow(`Gun with ID ${entry.pickupObjectId} (${texts.name}) not found in GunRepository.`));
      return;
    }

    const featureFlags: TGun["featureFlags"] = [];

    if (entry.isInfiniteAmmoGun) featureFlags.push("hasInfiniteAmmo");
    if (entry.doesntDamageSecretWalls) featureFlags.push("doesntDamageSecretWalls");

    const allStatModifiers = gunDto.currentGunStatModifiers.concat(gunDto.passiveStatModifiers ?? []);

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
        projectileModes: buildProjectileModules(gunDto, projectileRepo),
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
