import assert from "node:assert";
import chalk from "chalk";
import z from "zod/v4";
import invert from "lodash/invert.js";
import countBy from "lodash/countBy.js";
import keyBy from "lodash/keyBy.js";
import isEqual from "lodash/isEqual.js";
import cloneDeep from "lodash/cloneDeep.js";
import { GunClass, ItemQuality, ProjectileSequenceStyle, ShootStyle } from "../gun/gun.dto.ts";
import { videos } from "../gun/gun.meta.ts";
import { GunForStorage } from "./client/models/gun.model.ts";
import { GunRepository } from "../gun/gun.repository.ts";
import { ProjectileRepository } from "../gun/projectile.repository.ts";
import { StatModifier } from "../player/player.dto.ts";
import { VolleyRepository } from "../gun/volley.repository.ts";
import { AssetService } from "../asset/asset-service.ts";
import { SpriteService } from "../sprite/sprite.service.ts";
import { SpriteAnimatorRepository } from "../sprite/sprite-animator.repository.ts";
import { WrapMode } from "../sprite/sprite-animator.dto.ts";
import { basicColors } from "./client/models/color.model.ts";
import { ColorService } from "../color/color.service.ts";
import { PlayerService } from "../player/player.service.ts";
import { EnemyRepository } from "../enemy/enemy.repository.ts";
import type { TEncounterDatabase } from "../encouter-trackable/encounter-trackable.dto.ts";
import type { TGunDto, TProjectileModule } from "../gun/gun.dto.ts";
import type { TGun, TProjectileMode, TProjectilePerShot } from "./client/models/gun.model.ts";
import type { TProjectile } from "./client/models/projectile.model.ts";
import type { TAssetExternalReference } from "../utils/schema.ts";
import type { TProjectileDto } from "../gun/projectile.dto.ts";
import type { TAnimation } from "./client/models/animation.model.ts";
import type { TSpriteAnimatorDto } from "../sprite/sprite-animator.dto.ts";
import type { TSpriteData } from "../asset/component.dto.ts";

const gunQualityTextLookup = invert(ItemQuality);
const gunClassTextLookup = invert(GunClass);
const shootStyleTextLookup = invert(ShootStyle);
const modifyMethodTextLookup = invert(StatModifier.ModifyMethod);
const statTypeTextLookup = invert(StatModifier.StatType);
const wrapModeTextLookup = invert(WrapMode);

type GunModelGeneratorCtor = {
  gunRepo: GunRepository;
  projectileRepo: ProjectileRepository;
  volleyRepo: VolleyRepository;
  assetService: AssetService;
  spriteService: SpriteService;
  spriteAnimatorRepo: SpriteAnimatorRepository;
  playerService: PlayerService;
  enemyRepo: EnemyRepository;
};

export class GunModelGenerator {
  private readonly _gunRepo: GunRepository;
  private readonly _projectileRepo: ProjectileRepository;
  private readonly _volleyRepo: VolleyRepository;
  private readonly _assetService: AssetService;
  private readonly _spriteService: SpriteService;
  private readonly _spriteAnimatorRepo: SpriteAnimatorRepository;
  private readonly _playerService: PlayerService;
  private readonly _enemyRepo: EnemyRepository;
  private readonly _colorService = new ColorService();
  private readonly _featureFlags: Set<TGun["featureFlags"][number]> = new Set();

  private constructor(input: GunModelGeneratorCtor) {
    this._gunRepo = input.gunRepo;
    this._projectileRepo = input.projectileRepo;
    this._volleyRepo = input.volleyRepo;
    this._assetService = input.assetService;
    this._spriteService = input.spriteService;
    this._spriteAnimatorRepo = input.spriteAnimatorRepo;
    this._playerService = input.playerService;
    this._enemyRepo = input.enemyRepo;
  }
  static async create(input: GunModelGeneratorCtor) {
    return new GunModelGenerator(input);
  }

  /**
   * https://chatgpt.com/share/688f83f3-92e0-8010-ae87-780c262d6050
   */
  private _computeMaxRicochetDamage(
    baseDamage: number,
    numberOfBounces: number,
    chanceToDieOnBounce: number,
    damageMultiplierOnBounce: number,
  ): number {
    const survivalChance = 1 - chanceToDieOnBounce;
    const finalDamage = baseDamage * damageMultiplierOnBounce;

    // Special case: if it always survives, just return N * bounce damage
    if (survivalChance === 1) {
      return numberOfBounces * finalDamage;
    }

    const s = survivalChance;
    const n = numberOfBounces;

    // Step 1: compute expected number of successful bounces using geometric sum
    const expectedBounces = (s * (1 - Math.pow(s, n))) / (1 - s);

    // Step 2: each bounce deals partial damage, so apply multiplier
    const expectedBounceDamage = expectedBounces * finalDamage;

    return expectedBounceDamage;
  }

  private _getProjectileModules(
    gunDto: TGunDto,
    alternateVolley = false,
  ): { projectileModules: TProjectileModule[]; modulesAreTiers: boolean } {
    const volley = alternateVolley ? gunDto.gun.alternateVolley : gunDto.gun.rawVolley;
    if (!this._assetService.referenceExists(volley)) {
      return { projectileModules: [gunDto.gun.singleModule], modulesAreTiers: false };
    }

    const volleyDto = this._volleyRepo.getVolley(volley);
    if (!volleyDto) {
      throw new Error(
        `Parsing ${gunDto.gun.gunName} (${gunDto.gun.PickupObjectId}) gun failed: Volley with guid ${volley.guid} not found in VolleyRepository.`,
      );
    }

    return {
      projectileModules: volleyDto.projectiles,
      modulesAreTiers: Boolean(volleyDto?.ModulesAreTiers),
    };
  }

  private _getProjectile(gunDto: TGunDto, assetReference: Required<TAssetExternalReference>) {
    const projDto = this._projectileRepo.getProjectile(assetReference);
    if (!projDto) {
      throw new Error(
        `Parsing ${gunDto.gun.gunName} (${gunDto.gun.PickupObjectId}) gun failed: Projectile with guid ${assetReference.guid} not found in ProjectileRepository.`,
      );
    }
    return projDto;
  }

  private _buildProjectile(gunDto: TGunDto, projectileRef: Required<TAssetExternalReference>): TProjectile {
    const projDto = this._getProjectile(gunDto, projectileRef);
    const proj: TProjectile = {
      id: projDto.id,
      damage: projDto.projectile.baseData.damage,
      speed: projDto.projectile.baseData.speed,
      range: projDto.projectile.baseData.range,
      force: projDto.projectile.baseData.force,
      additionalDamage: [],
      animation: this._buildProjectileAnimation(projDto),
    };

    if (projDto.projectile.ignoreDamageCaps) proj.ignoreDamageCaps = true;

    if (projDto.projectile.AppliesPoison) {
      proj.poisonChance = projDto.projectile.PoisonApplyChance;
      proj.poisonDuration = projDto.projectile.healthEffect.duration;
      proj.additionalDamage.push({
        source: "poison",
        type: "dps",
        damage: projDto.projectile.healthEffect.DamagePerSecondToEnemies,
        canNotStack: true,
        isEstimated: projDto.projectile.PoisonApplyChance < 1,
      });
      this._featureFlags.add("hasStatusEffects");
    }
    if (
      projDto.projectile.AppliesSpeedModifier &&
      // Some mistakes where AppliesSpeedModifier doesn't mean anything
      // ExportedProject/Assets/GameObject/Railgun_Variant_Projectile.prefab
      projDto.projectile.speedEffect.SpeedMultiplier !== 1
    ) {
      proj.speedChance = projDto.projectile.SpeedApplyChance;
      proj.speedDuration = projDto.projectile.speedEffect.duration;
      proj.speedMultiplier = projDto.projectile.speedEffect.SpeedMultiplier;
      this._featureFlags.add("hasStatusEffects");
    }
    if (projDto.projectile.AppliesCharm) {
      proj.charmChance = projDto.projectile.CharmApplyChance;
      proj.charmDuration = projDto.projectile.charmEffect.duration;
      this._featureFlags.add("hasStatusEffects");
    }
    if (projDto.projectile.AppliesFreeze) {
      proj.freezeChance = projDto.projectile.FreezeApplyChance;
      proj.freezeDuration = projDto.projectile.freezeEffect.duration;
      proj.freezeAmount = projDto.projectile.freezeEffect.FreezeAmount;
      this._featureFlags.add("hasStatusEffects");
    }
    if (projDto.projectile.AppliesFire) {
      proj.fireChance = projDto.projectile.FireApplyChance;
      proj.fireDuration = projDto.projectile.fireEffect.duration;
      proj.additionalDamage.push({
        source: "fire",
        type: "dps",
        damage: projDto.projectile.fireEffect.DamagePerSecondToEnemies,
        canNotStack: true,
        isEstimated: projDto.projectile.FireApplyChance < 1,
      });
      this._featureFlags.add("hasStatusEffects");
    }
    if (projDto.projectile.AppliesStun) {
      proj.stunChance = projDto.projectile.StunApplyChance;
      proj.stunDuration = projDto.projectile.AppliedStunDuration;
      this._featureFlags.add("hasStatusEffects");
    }
    if (projDto.projectile.AppliesCheese) {
      proj.cheeseChance = projDto.projectile.CheeseApplyChance;
      proj.cheeseDuration = projDto.projectile.cheeseEffect.duration;
      proj.cheeseAmount = projDto.projectile.cheeseEffect.CheeseAmount;
      this._featureFlags.add("hasStatusEffects");
    }

    if (projDto.bounceProjModifier) {
      proj.numberOfBounces = projDto.bounceProjModifier.numberOfBounces;
      proj.damageMultiplierOnBounce = projDto.bounceProjModifier.damageMultiplierOnBounce;
      if ((projDto.bounceProjModifier.chanceToDieOnBounce ?? 0) > 0)
        proj.chanceToDieOnBounce = projDto.bounceProjModifier.chanceToDieOnBounce;

      proj.additionalDamage.push({
        source: "ricochet",
        isEstimated: true,
        damage: this._computeMaxRicochetDamage(
          proj.damage,
          projDto.bounceProjModifier.numberOfBounces,
          projDto.bounceProjModifier.chanceToDieOnBounce ?? 0,
          projDto.bounceProjModifier.damageMultiplierOnBounce,
        ),
      });
    }
    if (projDto.pierceProjModifier) {
      proj.penetration = projDto.pierceProjModifier.penetration;
      proj.canPenetrateObjects = Boolean(projDto.pierceProjModifier.penetratesBreakables);
    }

    let explosionData = projDto.explosiveModifier?.doExplosion && projDto.explosiveModifier?.explosionData;
    if (this._projectileRepo.isCerebralBoreProjectile(projDto.projectile)) {
      explosionData = projDto.projectile.explosionData;
    } else if (
      /* Game code only triggers antimatter explosion and ignore the matter projectile */
      projDto.matterAntimatterProjModifier?.isAntimatter
    ) {
      explosionData = projDto.matterAntimatterProjModifier.antimatterExplosion;
      proj.blankOnCollision = true;
    } else if (projDto.stickyGrenadeBuff?.IsSynergyContingent === 0) {
      explosionData = projDto.stickyGrenadeBuff.explosionData;
      proj.sticky = true;
    }
    if (explosionData) {
      if (explosionData.doDamage) {
        proj.explosionRadius = explosionData.damageRadius;
        proj.additionalDamage.push({
          source: "explosion",
          damage: explosionData.damage,
        });
      }
      if (explosionData.doForce) {
        proj.explosionForce = explosionData.force;
      }
      if (explosionData.isFreezeExplosion) {
        proj.explosionFreezeRadius = explosionData.freezeRadius;
        proj.freezeChance = 1;
        proj.freezeDuration = explosionData.freezeEffect.duration;
        proj.freezeAmount = explosionData.freezeEffect.FreezeAmount;
        this._featureFlags.add("hasStatusEffects");
      }
      this._featureFlags.add("hasExplosiveProjectile");
    }

    if (projDto.modifyProjectileSynergyProcessor?.Dejams) {
      proj.dejam = true;
      this._featureFlags.add("hasSpecialProjectiles");
    }
    if (projDto.modifyProjectileSynergyProcessor?.Blanks) {
      proj.blankOnCollision = true;
      this._featureFlags.add("hasSpecialProjectiles");
    }

    // TODO: handle synergy
    if (projDto.goopModifier?.goopDefinitionData && !projDto.goopModifier.IsSynergyContingent) {
      if (projDto.goopModifier.goopDefinitionData.CanBeIgnited) {
        if (projDto.goopModifier.SpawnGoopOnCollision) {
          proj.hasOilGoop = true;
          proj.spawnGoopOnCollision = true;
          proj.goopCollisionRadius = projDto.goopModifier.CollisionSpawnRadius;
          // TODO: only add this if the gun has fire projectiles. Handle: Fossilized gun, Molotov launcher
          proj.additionalDamage.push({
            source: "oilGoop",
            isEstimated: true,
            canNotStack: true,
            type: "dps",
            damage: projDto.goopModifier.goopDefinitionData.fireDamagePerSecondToEnemies,
          });
          this._featureFlags.add("hasGoop");
        }
        if (projDto.goopModifier.SpawnGoopInFlight) {
          // TODO: composition gun with synergy
        }
      }
    }

    // homing
    const projScript = projDto.projectile.m_Script.$$scriptPath;
    if (projScript.endsWith("RobotechProjectile.cs.meta") || projScript.endsWith("BeeProjectile.cs.meta")) {
      proj.isHoming = true;
    }
    if (projScript.endsWith("BoomerangProjectile.cs.meta")) {
      proj.isHoming = true;
      proj.stunChance = 1; // Boomerang always stuns. See BoomerangProjectile.cs#StunDuration
      proj.stunDuration = projDto.projectile.StunDuration;
      this._featureFlags.add("hasStatusEffects");
    }
    if (projScript.endsWith("CerebralBoreProjectile.cs.meta")) {
      proj.isHoming = true;
      proj.stunChance = 1; // CerebralBoreProjectile always stuns.
      proj.stunDuration = 1; // CerebralBoreProjectile#HandleBoring()
      this._featureFlags.add("hasStatusEffects");
    }
    if (projScript.endsWith("InstantlyDamageAllProjectile.cs.meta")) {
      proj.damageAllEnemies = true;
    }
    if (projDto.blackHoleDoer) {
      proj.additionalDamage.push({
        type: "dps",
        source: "blackhole",
        damage: projDto.blackHoleDoer.damageToEnemiesPerSecond,
      });
    }
    if (projDto.mindControlProjModifier) {
      proj.mindControl = true;
      this._featureFlags.add("hasSpecialProjectiles");
    }
    if (projDto.homingModifier) {
      proj.isHoming = true;
      proj.homingRadius = projDto.homingModifier.HomingRadius;
      proj.homingAngularVelocity = projDto.homingModifier.AngularVelocity;
    }
    if (projDto.basicBeamController) {
      if (projDto.basicBeamController.usesChargeDelay) proj.beamChargeTime = projDto.basicBeamController.chargeDelay;
      if (this._featureFlags.has("hasStatusEffects")) {
        proj.beamStatusEffectChancePerSecond = projDto.basicBeamController.statusEffectChance;
      }
      if (projDto.basicBeamController.homingRadius > 0) {
        proj.isHoming = true;
        proj.homingRadius = projDto.basicBeamController.homingRadius;
        proj.homingAngularVelocity = projDto.basicBeamController.homingAngularVelocity;
      }
    }
    if (projDto.raidenBeamController) {
      proj.isHoming = true;
      if (projDto.raidenBeamController.maxTargets === -1) {
        proj.damageAllEnemies = true;
      }
    }
    if (gunDto.predatorGunController) {
      proj.isHoming = true;
      proj.homingRadius = gunDto.predatorGunController.HomingRadius;
      proj.homingAngularVelocity = gunDto.predatorGunController.HomingAngularVelocity;
    }

    if (projDto.projectile.CanTransmogrify && projDto.projectile.TransmogrifyTargetGuids.length > 0) {
      proj.chanceToTransmogrify = projDto.projectile.ChanceToTransmogrify;
      proj.transmogrifyTarget = this._enemyRepo.getEnemyName(projDto.projectile.TransmogrifyTargetGuids[0]);

      proj.additionalDamage.push({
        source: "transmogrification",
        isEstimated: true,
        damage: 1e6,
      });
      this._featureFlags.add("hasSpecialProjectiles");
    }

    if (this._projectileRepo.isHelixProjectileData(projDto.projectile)) {
      proj.helixAmplitude = projDto.projectile.helixAmplitude;
      proj.helixWavelength = projDto.projectile.helixWavelength;
    }
    if (projDto.matterAntimatterProjModifier?.isAntimatter) {
      proj.antimatter = true;
    }
    if (projDto.devolverModifier) {
      proj.devolveChance = projDto.devolverModifier.chanceToDevolve;
      proj.devolveTarget = this._enemyRepo.getEnemyName(projDto.devolverModifier.DevolverHierarchy[0].tierGuids[0]);
      this._featureFlags.add("hasSpecialProjectiles");
    }

    if (proj.isHoming) {
      this._featureFlags.add("hasHomingProjectiles");
    }
    if (proj.damageAllEnemies) {
      this._featureFlags.add("damageAllEnemies");
    }

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
    modules: TProjectileModule[],
  ): TProjectileMode {
    const projectilesPerShot: TProjectilePerShot[] = [];
    for (const module of modules) {
      let projectiles = module.projectiles
        .filter(this._assetService.referenceExists)
        .map((p) => this._buildProjectile(gunDto, p));

      if (module.sequenceStyle === ProjectileSequenceStyle.Random) {
        projectiles = this._computeProjectileSpawnWeight(projectiles);
      } else {
        // TODO: handle other sequence styles
      }
      projectilesPerShot.push({
        shootStyle: shootStyleTextLookup[module.shootStyle] as keyof typeof ShootStyle,
        cooldownTime: module.cooldownTime,
        burstShotCount: module.burstShotCount,
        burstCooldownTime: module.burstCooldownTime,
        spread: module.angleVariance,
        ammoCost: module.ammoCost > 1 && defaultModule.shootStyle !== ShootStyle.Beam ? module.ammoCost : undefined,
        projectiles,
      });

      if (module.mirror) {
        projectilesPerShot.push(cloneDeep(projectilesPerShot.at(-1)!));
      }
    }
    let chargeTime = typeof mode === "number" ? mode : undefined;
    if (defaultModule.shootStyle === ShootStyle.Beam) {
      if (projectilesPerShot[0].projectiles.length > 1) {
        throw new Error(
          `Parsing ${gunDto.gun.gunName} (${gunDto.gun.PickupObjectId}) gun failed: Beam gun must have only one type of projectile.`,
        );
      }
      chargeTime = Math.max(
        ...projectilesPerShot.map((pps) => pps.projectiles.map((p) => p.beamChargeTime ?? 0)).flat(),
      );
    }
    return {
      mode: typeof mode === "number" ? `Charge ${mode}` : mode,
      magazineSize: defaultModule.numberOfShotsInClip,
      chargeTime,
      projectiles: projectilesPerShot,
    };
  }

  private _buildProjectileModes(gunDto: TGunDto): TProjectileMode[] {
    const { modulesAreTiers, projectileModules } = this._getProjectileModules(gunDto);

    // see Gun.cs#DefaultModule. Some attributes within the module like numberOfShotsInClip/shootStyle
    // should be tied to a gun, not the projectile data. DefaultModule is used to retrieve those attributes
    // for the gun model
    const defaultModule = projectileModules[0];

    // each module is a separate tier level (mode)
    if (modulesAreTiers) {
      this._featureFlags.add("hasTieredProjectiles");
      return projectileModules.map((mod, i) =>
        this._buildModeFromProjectileModules(`Lvl ${i + 1}`, gunDto, defaultModule, [mod]),
      );
    }

    if (gunDto.gun.IsTrickGun) {
      const { projectileModules: alternateModules } = this._getProjectileModules(gunDto, true);

      return [
        this._buildModeFromProjectileModules(`Normal`, gunDto, defaultModule, projectileModules),
        this._buildModeFromProjectileModules(`Alternate`, gunDto, alternateModules[0], alternateModules),
      ];
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
          `${gunDto.gun.gunName}, A projectile module must not have multiple projectiles with the same charge time. This is undefined behavior`,
        );
      }

      for (const { ChargeTime, Projectile, AmmoCost } of module.chargeProjectiles) {
        if (!Projectile.guid) continue;
        if (!chargeModulesLookup.get(ChargeTime)) chargeModulesLookup.set(ChargeTime, []);

        const chargeModules = chargeModulesLookup.get(ChargeTime)!;
        const clonedModule = cloneDeep(module);
        clonedModule.projectiles = [cloneDeep(Projectile)];
        clonedModule.ammoCost = AmmoCost;
        clonedModule.chargeProjectiles = [];
        chargeModules.push(clonedModule);
      }
    }
    const res: TProjectileMode[] = [];
    // TODO: rework estimated bounce damage, it only increases potential damage if paired with penetration.
    // TODO: SpawnProjModifier (The Scrambler, Particulator)
    // TODO: homing bullet
    // TODO: ShovelGunModifier
    // TODO: search for *modifier.cs to collect more attributes for the projectile
    // TODO: round that has explosion on impact count as another source of damage
    // TODO: Synergies: link 2 guns (e.g. NonSynergyGunId -> (SynergyGunId, PartnerGunID))
    //    ExportedProject/Assets/data/AAA_AdvSynergyManager.asset
    //    ExportedProject/Assets/Scripts/Assembly-CSharp/CustomSynergyType.cs
    // TODO: fear effect
    // TODO: add a badge next to best stat: https://fontawesome.com/icons/medal?f=classic&s=solid
    // Edge cases:
    // TODO: Rad gun: update modified reload time & animation speed on each level
    // TODO: black hole gun reload sprites are not anchored correctly. Investigate reloadOffset
    //  Comparison: crossbow
    // TODO: add muzzleFlashEffects in idle animation for The Fat Line
    // TODO: add unused reload animation for The Fat Line (?)

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

  private _buildAttribute(gunDto: TGunDto): TGun["attribute"] {
    const attributes: TGun["attribute"] = {
      reflectDuringReload: Boolean(gunDto.gun.reflectDuringReload) || undefined,
      reflectDuringReloadDmgModifier: gunDto.gunExtraSettingSynergyProcessor?.ReflectedBulletDamageModifier,
      blankDuringReload: (gunDto.gun.blankDuringReload && !gunDto.gun.reflectDuringReload) || undefined,
      blankReloadRadius:
        gunDto.gun.blankDuringReload || gunDto.gun.reflectDuringReload ? gunDto.gun.blankReloadRadius : undefined,
      activeReload: Boolean(gunDto.gun.LocalActiveReload) || undefined,

      auraOnReload: Boolean(gunDto.auraOnReloadModifier) || undefined,
      auraOnReloadRadius: gunDto.auraOnReloadModifier?.AuraRadius,
      auraOnReloadDps: gunDto.auraOnReloadModifier?.DamagePerSecond,
      auraOnReloadIgniteDps: gunDto.auraOnReloadModifier?.IgnitesEnemies
        ? gunDto.auraOnReloadModifier?.IgniteEffect.DamagePerSecondToEnemies
        : undefined,

      trickGun: Boolean(gunDto.gun.IsTrickGun) || undefined,
    };

    for (const value of Object.values(attributes)) {
      if (value === true) {
        this._featureFlags.add("hasSpecialAbilities");
      }
    }

    return attributes;
  }

  private _buildAnimation(clip: TSpriteAnimatorDto["clips"][number], debugId: string) {
    const frames: TAnimation["frames"] = [];
    let texturePath = "";

    for (let i = 0; i < clip.frames.length; i++) {
      const frame = clip.frames[i];
      const { spriteData, texturePath: frameTexturePath } = this._spriteService.getSprite(
        frame.spriteCollection.$$scriptPath,
        frame.spriteId,
      );
      if (!spriteData.name) {
        throw new Error(`Sprite data is missing a name for frame ${frame.spriteId}. ${chalk.green(debugId)}`);
      }
      if (texturePath) {
        assert(texturePath === frameTexturePath, "All frames must have the same texture path");
      } else {
        texturePath = frameTexturePath;
      }
      frames.push({
        uvs: spriteData.uvs,
        flipped: Boolean(spriteData.flipped),
      });
    }

    return {
      name: clip.name || "",
      fps: clip.fps,
      loopStart: clip.loopStart,
      wrapMode: wrapModeTextLookup[clip.wrapMode] as keyof typeof WrapMode,
      minFidgetDuration: clip.minFidgetDuration,
      maxFidgetDuration: clip.maxFidgetDuration,
      texturePath,
      frames,
    };
  }

  private _buildAnimationFromName(
    gunDto: TGunDto,
    animationName?: string | null,
    override?: Partial<TAnimation>,
  ): TAnimation | undefined {
    if (!animationName) return;
    const clip = this._spriteAnimatorRepo.getClip(gunDto.spriteAnimator.library, animationName);
    if (!clip) return;

    const animation = this._buildAnimation(clip, `Animation name: ${animationName}`);
    return { ...animation, ...override };
  }

  private _buildAnimationFromSprite(spriteData: TSpriteData): TAnimation | undefined {
    if (!spriteData) return;

    const res = this._spriteService.getSprite(spriteData.collection.$$scriptPath, spriteData._spriteId);

    return {
      name: res.spriteData.name,
      fps: 0,
      loopStart: 0,
      texturePath: res.texturePath,
      wrapMode: "Single",
      minFidgetDuration: 0,
      maxFidgetDuration: 0,
      frames: [
        {
          uvs: res.spriteData.uvs,
          flipped: Boolean(res.spriteData.flipped),
        },
      ],
    };
  }

  private _buildProjectileAnimation(projectileDto: TProjectileDto): TAnimation | undefined {
    if (projectileDto.spriteAnimator) {
      const { library, defaultClipId } = projectileDto.spriteAnimator;
      const clip = this._spriteAnimatorRepo.getClipByIndex(library, defaultClipId);
      return this._buildAnimation(clip, `projectile id: ${projectileDto.id}`);
    }
    if (projectileDto.sprite) {
      return this._buildAnimationFromSprite(projectileDto.sprite);
    }
    console.log(chalk.yellow(`No sprite animator or sprite found for projectile ${chalk.green(projectileDto.id)}`));
  }

  private async _buildGunChargeAnimation(gunDto: TGunDto): Promise<TAnimation | undefined> {
    const { projectileModules } = this._getProjectileModules(gunDto);
    const isChargeGun = projectileModules.some(
      (m) =>
        (m.shootStyle === ShootStyle.Charged && m.chargeProjectiles.some((m) => m.ChargeTime > 0)) ||
        (m.shootStyle === ShootStyle.Beam &&
          m.projectiles.filter(this._assetService.referenceExists).some((m) => {
            const projDto = this._getProjectile(gunDto, m);
            return projDto?.basicBeamController?.usesChargeDelay && projDto?.basicBeamController?.chargeDelay;
          })),
    );
    if (!isChargeGun) return;

    return this._buildAnimationFromName(gunDto, gunDto.gun.chargeAnimation ?? gunDto.gun.shootAnimation);
  }

  private async _buildGunIdleAnimation(gunDto: TGunDto): Promise<TAnimation> {
    const animationName = gunDto.gun.idleAnimation;
    if (animationName) {
      let texturePath = "";
      const clip = this._spriteAnimatorRepo.getClip(gunDto.spriteAnimator.library, animationName);
      const frames: TAnimation["frames"] = [];

      if (clip) {
        for (let i = 0; i < clip.frames.length; i++) {
          const frame = clip.frames[i];
          const { spriteData, texturePath: spriteTexturePath } = this._spriteService.getSprite(
            frame.spriteCollection.$$scriptPath,
            frame.spriteId,
          );
          if (!spriteData.name) {
            throw new Error(
              `Sprite data is missing a name for frame ${frame.spriteId} of clip ${chalk.green(animationName)}`,
            );
          }
          frames.push({
            uvs: spriteData.uvs,
            flipped: Boolean(spriteData.flipped),
          });
          if (texturePath) {
            assert(texturePath === spriteTexturePath, "All frames must have the same texture path");
          } else {
            texturePath = spriteTexturePath;
          }
        }

        return {
          name: clip.name!,
          fps: clip.fps,
          loopStart: clip.loopStart,
          wrapMode: wrapModeTextLookup[clip.wrapMode] as keyof typeof WrapMode,
          minFidgetDuration: clip.minFidgetDuration,
          maxFidgetDuration: clip.maxFidgetDuration,
          texturePath,
          frames,
        };
      } else {
        console.warn(
          chalk.yellow(
            `Clip ${chalk.green(animationName)} not found in animation collection. Falling back to the default sprite.`,
          ),
        );
      }
    }

    const animationFromSprite = this._buildAnimationFromSprite(gunDto.sprite);
    if (animationFromSprite) {
      return animationFromSprite;
    }

    throw new Error(chalk.red(`No valid sprite found for gun ${gunDto.gun.gunName}`));
  }

  private async _buildDominantColors(gunDto: TGunDto): Promise<string[]> {
    if (gunDto.gun.idleAnimation) {
      const clip = this._spriteAnimatorRepo.getClip(gunDto.spriteAnimator.library, gunDto.gun.idleAnimation);
      if (clip) {
        const image = await this._spriteService.getSpriteImage(
          clip?.frames[0].spriteCollection.$$scriptPath,
          clip?.frames[0].spriteId,
        );
        return this._colorService.findDominantColors(image, basicColors);
      }
    }

    const image = await this._spriteService.getSpriteImage(
      gunDto.sprite.collection.$$scriptPath,
      gunDto.sprite._spriteId,
    );
    return this._colorService.findDominantColors(image, basicColors);
  }

  private _buildStatModifiers(gunDto: TGunDto): TGun["playerStatModifiers"] {
    const allStatModifiers = gunDto.gun.currentGunStatModifiers.concat(gunDto.gun.passiveStatModifiers ?? []);

    // hidden stat modifier not presented anywhere on the wiki
    if (gunDto.gun.UsesBossDamageModifier === 1) {
      allStatModifiers.push({
        statToBoost: StatModifier.StatType.DamageToBosses,
        modifyType: StatModifier.ModifyMethod.MULTIPLICATIVE,
        amount: gunDto.gun.CustomBossDamageModifier >= 0 ? gunDto.gun.CustomBossDamageModifier : 0.8,
      });
    }
    if (allStatModifiers.length > 0) {
      this._featureFlags.add("hasStatModifiers");
    }

    return allStatModifiers.map((m) => ({
      statToBoost: statTypeTextLookup[m.statToBoost] as keyof typeof StatModifier.StatType,
      modifyType: modifyMethodTextLookup[m.modifyType] as keyof typeof StatModifier.ModifyMethod,
      amount: m.amount,
    }));
  }

  private _postProcessGunModel(gun: TGun) {
    // force casey final sprite to stay horizontally to fit in the ui element.
    if ([541, 616].includes(gun.id)) {
      for (const animation in gun.animation) {
        if (gun.animation[animation] && animation !== "charge") {
          gun.animation[animation] = { ...gun.animation[animation], rotate: 90 } as TAnimation;
        }
      }
    }

    // Most intro animations for gun actually use the reload animation, but some guns have unusually high reload speed for the first frame.
    // So we need to cut the first frame short so the intro does not drag on.
    const reloadAnimation = gun.animation.reload;
    if (reloadAnimation) {
      const duration = reloadAnimation.fps * reloadAnimation.frames.length;
      if (duration >= 1.5) {
        const firstFrameInstance = JSON.stringify(reloadAnimation.frames[0]);
        let isFirstFrame = true;
        const shortenenFrames: TAnimation["frames"] = [];
        let firstFrameDuration = 0;

        for (const frame of reloadAnimation.frames) {
          const frameInstance = JSON.stringify(frame);

          if (isFirstFrame) {
            isFirstFrame = frameInstance === firstFrameInstance;
          }

          if (isFirstFrame) {
            firstFrameDuration += 1 / reloadAnimation.fps;
          }
          if (firstFrameDuration >= 0.6 && isFirstFrame) continue;
          shortenenFrames.push(frame);
        }

        if (reloadAnimation.frames.length !== shortenenFrames.length) {
          console.log(
            chalk.gray(
              `Shortened reload animation for gun ${chalk.green(gun.name)} from ${reloadAnimation.frames.length} to ${shortenenFrames.length} frames`,
            ),
          );
        }

        reloadAnimation.frames = shortenenFrames;
      }
    }

    for (const modes of gun.projectileModes) {
      for (const projectilePerShot of modes.projectiles) {
        const projectileIds = new Set<string>();
        for (const projectile of projectilePerShot.projectiles) {
          projectileIds.add(projectile.id);
        }
        if (projectileIds.size > 1) {
          this._featureFlags.add("hasProjectilePool");
        }
      }
    }

    gun.featureFlags = Array.from(this._featureFlags);

    return gun;
  }

  async generate(entry: TEncounterDatabase["Entries"][number]) {
    try {
      this._featureFlags.clear();

      const texts = {
        name: entry.journalData.PrimaryDisplayName ?? "",
        quote: entry.journalData.NotificationPanelDescription ?? "",
        description: entry.journalData.AmmonomiconFullEntry ?? "",
      };

      // Remove that big-ass hammer
      if (!texts.name) {
        return;
      }

      const gunDto = this._gunRepo.getGun(entry.pickupObjectId);
      if (!gunDto) {
        console.warn(chalk.yellow(`Gun with ID ${entry.pickupObjectId} (${texts.name}) not found in GunRepository.`));
        return;
      }

      if (entry.isInfiniteAmmoGun) this._featureFlags.add("hasInfiniteAmmo");
      if (entry.doesntDamageSecretWalls) this._featureFlags.add("doesntDamageSecretWalls");

      const startingItemOf = this._playerService.getOwners(entry.pickupObjectId, "startingGunIds");
      const startingAlternateItemOf = this._playerService.getOwners(entry.pickupObjectId, "startingAlternateGunIds");

      const gun: TGun = {
        ...texts,
        type: "gun",
        id: entry.pickupObjectId,
        startingItemOf,
        startingAlternateItemOf: isEqual(startingItemOf, startingAlternateItemOf) ? undefined : startingAlternateItemOf,
        gunNameInternal: gunDto.gun.gunName,
        quality: gunQualityTextLookup[gunDto.gun.quality] as keyof typeof ItemQuality,
        gunClass: gunClassTextLookup[gunDto.gun.gunClass] as keyof typeof GunClass,
        playerStatModifiers: this._buildStatModifiers(gunDto),
        maxAmmo: gunDto.gun.maxAmmo,
        reloadTime: gunDto.gun.reloadTime,
        featureFlags: [],
        projectileModes: this._buildProjectileModes(gunDto),
        attribute: this._buildAttribute(gunDto),
        colors: await this._buildDominantColors(gunDto),
        animation: {
          idle: await this._buildGunIdleAnimation(gunDto),
          // Fix Turbo-Gun reload animation getting stuck in a loop
          reload: this._buildAnimationFromName(gunDto, gunDto.gun.reloadAnimation, { wrapMode: "Once" }),
          intro: this._buildAnimationFromName(gunDto, gunDto.gun.introAnimation, { wrapMode: "Once" }),
          ...(gunDto.gun.IsTrickGun && {
            alternateIdle: this._buildAnimationFromName(gunDto, gunDto.gun.alternateIdleAnimation),
            alternateReload: this._buildAnimationFromName(gunDto, gunDto.gun.alternateReloadAnimation, {
              wrapMode: "Once",
            }),
          }),
          charge: await this._buildGunChargeAnimation(gunDto),
        },
        video: videos.has(entry.pickupObjectId) ? videos.get(entry.pickupObjectId) : undefined,
      };

      return GunForStorage.parse(this._postProcessGunModel(gun));
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(chalk.red(`Error parsing GUN pickup-object with ID ${entry.pickupObjectId}:`));
        console.error(z.prettifyError(error));
      }
      throw error;
    }
  }
}
