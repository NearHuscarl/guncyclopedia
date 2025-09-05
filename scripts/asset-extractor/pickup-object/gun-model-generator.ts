import assert from "node:assert";
import chalk from "chalk";
import z from "zod/v4";
import invert from "lodash/invert.js";
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
import { ProjectileForStorage } from "./client/models/projectile.model.ts";
import type { TEncounterDatabase } from "../encouter-trackable/encounter-trackable.dto.ts";
import type { TGunDto, TProjectileModuleDto } from "../gun/gun.dto.ts";
import type { TGun, TProjectileMode, TProjectileModule } from "./client/models/gun.model.ts";
import type { TProjectile, TProjectileId } from "./client/models/projectile.model.ts";
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
  private _gunProjectiles: Record<TProjectileId, TProjectile> = {};

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
  private _computeAverageBounces(numberOfBounces: number, chanceToDieOnBounce: number): number {
    const survivalChance = 1 - chanceToDieOnBounce;
    if (survivalChance === 1) {
      return numberOfBounces;
    }

    const s = survivalChance;
    const n = numberOfBounces;

    // compute expected number of successful bounces using geometric sum
    const expectedBounces = (s * (1 - Math.pow(s, n))) / (1 - s);

    return expectedBounces;
  }

  private _getProjectileModules(
    gunDto: TGunDto,
    alternateVolley = false,
  ): { projectileModules: TProjectileModuleDto[]; modulesAreTiers: boolean } {
    const volley = alternateVolley ? gunDto.gun.alternateVolley : gunDto.gun.rawVolley;
    if (!this._assetService.referenceExists(volley)) {
      return { projectileModules: [gunDto.gun.singleModule], modulesAreTiers: false };
    }

    const volleyDto = this._volleyRepo.getVolley(volley);
    if (!volleyDto) {
      throw new Error(
        `Parsing ${gunDto.name} (${gunDto.gun.PickupObjectId}) gun failed: Volley with guid ${volley.guid} not found in VolleyRepository.`,
      );
    }

    return {
      projectileModules: volleyDto.projectiles,
      modulesAreTiers: Boolean(volleyDto?.ModulesAreTiers),
    };
  }

  private _getProjectileDto(gunDto: TGunDto, assetReference: Required<TAssetExternalReference>) {
    const projDto = this._projectileRepo.getProjectile(assetReference);
    if (!projDto) {
      throw new Error(
        `Parsing ${gunDto.name} (${gunDto.gun.PickupObjectId}) gun failed: Projectile with guid ${assetReference.guid} not found in ProjectileRepository.`,
      );
    }
    return projDto;
  }

  private _buildProjectile(gunDto: TGunDto, projectileRef: Required<TAssetExternalReference>): TProjectileId {
    const projDto = this._getProjectileDto(gunDto, projectileRef);
    const proj: TProjectile = {
      id: projDto.id,
      gunId: gunDto.gun.PickupObjectId,
      damage: projDto.projectile.baseData.damage,
      speed: projDto.projectile.baseData.speed,
      range: projDto.projectile.baseData.range,
      force: projDto.projectile.baseData.force,
      additionalDamage: [],
      animation: this._buildProjectileAnimation(projDto),
    };

    if (proj.speed === -1) proj.speed = 10_000;
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

      proj.averageSurvivingBounces = this._computeAverageBounces(
        projDto.bounceProjModifier.numberOfBounces,
        projDto.bounceProjModifier.chanceToDieOnBounce ?? 0,
      );
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
          type: "instant",
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

    if (projDto.spawnProjModifier) {
      const { spawnProjModifier } = projDto;
      if (spawnProjModifier.spawnProjectilesInFlight && spawnProjModifier.spawnProjectilesOnCollision) {
        throw new Error("Unhandled: Cannot spawn projectiles in flight and on collision at the same time");
      }
      if (spawnProjModifier.spawnCollisionProjectilesOnBounce && !spawnProjModifier.spawnProjectilesOnCollision) {
        throw new Error("Unhandled: Cannot spawn projectiles on bounce if not spawning on collision");
      }

      proj.spawnProjectilesInflight = Boolean(spawnProjModifier.spawnProjectilesInFlight);
      if (spawnProjModifier.spawnProjectilesInFlight) {
        proj.spawnProjectilesInflightPerSecond = 1 / spawnProjModifier.inFlightSpawnCooldown;
      }

      proj.spawnProjectilesOnCollision = Boolean(spawnProjModifier.spawnProjectilesOnCollision);
      proj.spawnCollisionProjectilesOnBounce = Boolean(spawnProjModifier.spawnCollisionProjectilesOnBounce);
      proj.spawnProjectileNumber = spawnProjModifier.spawnProjectilesInFlight
        ? spawnProjModifier.numToSpawnInFlight
        : spawnProjModifier.numberToSpawnOnCollison;
      if (proj.spawnCollisionProjectilesOnBounce && projDto.bounceProjModifier) {
        proj.spawnProjectileMaxNumber = proj.spawnProjectileNumber * (projDto.bounceProjModifier.numberOfBounces + 1);
      }
      const spawnProjReference = (
        spawnProjModifier.spawnProjectilesInFlight
          ? spawnProjModifier.projectileToSpawnInFlight
          : spawnProjModifier.UsesMultipleCollisionSpawnProjectiles
            ? spawnProjModifier.collisionSpawnProjectiles[0]
            : spawnProjModifier.projectileToSpawnOnCollision
      ) as Required<TAssetExternalReference>;
      proj.spawnProjectile = this._buildProjectile(gunDto, spawnProjReference);

      this._featureFlags.add("hasSpawningProjectiles");
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
    if (this._projectileRepo.isBeeProjectileData(projDto.projectile)) {
      proj.isHoming = true;
      proj.isBeeLikeTargetBehavior = true;
      proj.homingRadius = 100;
      proj.homingAngularVelocity = projDto.projectile.angularAcceleration;

      if (projDto.healthModificationBuff) {
        proj.isBee = true;
        proj.beeStingDuration = projDto.healthModificationBuff.lifetime;
        if (projDto.healthModificationBuff.healthChangeAtStart !== projDto.healthModificationBuff.healthChangeAtEnd) {
          throw new Error("Not handled: healthChangeAtStart !== healthChangeAtEnd for healthModificationBuff");
        }
        proj.additionalDamage.push({
          type: "instant",
          source: "bee",
          // Note: maxLifetime & healthChange range is unused
          damage:
            Math.abs(projDto.healthModificationBuff.healthChangeAtEnd) *
            (projDto.healthModificationBuff.lifetime / projDto.healthModificationBuff.tickPeriod),
        });
      }

      this._featureFlags.add("hasSpecialProjectiles");
    }
    if (this._projectileRepo.isRobotechProjectileData(projDto.projectile)) {
      proj.isHoming = true;
      proj.homingRadius = 100;
      proj.homingAngularVelocity = projDto.projectile.angularAcceleration;
    }
    if (this._projectileRepo.isBoomerangProjectileData(projDto.projectile)) {
      proj.isHoming = true;
      proj.homingRadius = 100; // no limitation
      proj.homingAngularVelocity = projDto.projectile.trackingSpeed;
      proj.stunChance = 1; // Boomerang always stuns. See BoomerangProjectile.cs#StunDuration
      proj.stunDuration = projDto.projectile.StunDuration;
      this._featureFlags.add("hasStatusEffects");
      this._featureFlags.add("hasSpecialProjectiles");
    }
    if (this._projectileRepo.isCerebralBoreProjectile(projDto.projectile)) {
      proj.isHoming = true;
      proj.homingRadius = 100;
      // No angular acceleration limit; rotation snaps to Bezier direction in 3° steps for each frame.
      // Max instantaneous angular velocity: 180° per frame (~10,800°/s at 60fps), if shooting
      // in the opposite direction of the enemy (Vector2.Inverted).
      // https://chatgpt.com/share/68b55577-ac54-8010-ab03-36392b596178
      proj.homingAngularVelocity = 1000;
      proj.stunChance = 1; // CerebralBoreProjectile always stuns.
      proj.stunDuration = 1; // CerebralBoreProjectile#HandleBoring()
      this._featureFlags.add("hasStatusEffects");
    }
    if (gunDto.predatorGunController) {
      proj.isHoming = true;
      proj.homingRadius = gunDto.predatorGunController.HomingRadius;
      proj.homingAngularVelocity = gunDto.predatorGunController.HomingAngularVelocity;
    }

    if (projScript.endsWith("InstantlyDamageAllProjectile.cs.meta")) {
      proj.damageAllEnemies = true;
    }
    if (projDto.blackHoleDoer) {
      proj.isBlackhole = true;
      proj.additionalDamage.push({
        type: "dps",
        source: "blackhole",
        damage: projDto.blackHoleDoer.damageToEnemiesPerSecond,
      });
      this._featureFlags.add("hasSpecialProjectiles");
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
      proj.homingRadius = 50; // estimated, the real value is your viewport size. See `damageAllEnemiesRadius`
      proj.homingAngularVelocity = 1000; // instant auto aim and grab the enemies
      if (projDto.raidenBeamController.maxTargets === -1) {
        proj.damageAllEnemies = true;
        proj.damageAllEnemiesRadius = projDto.raidenBeamController.targetType;
      }
      this._featureFlags.add("hasSpecialProjectiles");
    }

    if (projDto.projectile.CanTransmogrify && projDto.projectile.TransmogrifyTargetGuids.length > 0) {
      proj.chanceToTransmogrify = projDto.projectile.ChanceToTransmogrify;
      proj.transmogrifyTarget = this._enemyRepo.getEnemyName(projDto.projectile.TransmogrifyTargetGuids[0]);

      proj.additionalDamage.push({
        type: "instant",
        source: "transmogrification",
        damageChance: projDto.projectile.ChanceToTransmogrify,
        damage: 1e6,
      });
      this._featureFlags.add("hasSpecialProjectiles");
    }

    if (projDto.id === "GrapplingHook" && gunDto.trackInputDirectionalPad) {
      proj.damage = gunDto.trackInputDirectionalPad.grappleModule.DamageToEnemies;
      proj.force = gunDto.trackInputDirectionalPad.grappleModule.EnemyKnockbackForce;
      proj.speed = gunDto.trackInputDirectionalPad.grappleModule.GrappleSpeed;
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
      const arrowKinHealth = 15;
      const gunNutHealth = 100;
      proj.additionalDamage.push({
        type: "instant",
        source: "devolver",
        isEstimated: true,
        // ArrowKin health is 15, a lot of enemies have at least the same base health and only a few enemies is below that.
        // The strongest common enemy is Gun Nut (100)
        damage: gunNutHealth - arrowKinHealth - projDto.projectile.baseData.damage,
      });
      this._featureFlags.add("hasSpecialProjectiles");
    }

    if (proj.isHoming) {
      this._featureFlags.add("hasHomingProjectiles");
    }
    if (proj.damageAllEnemies) {
      this._featureFlags.add("damageAllEnemies");
    }

    if (!this._gunProjectiles[proj.id]) {
      this._gunProjectiles[proj.id] = proj;
    } else if (JSON.stringify(this._gunProjectiles[proj.id]) !== JSON.stringify(proj)) {
      console.log(chalk.green(JSON.stringify(this._gunProjectiles[proj.id], null, 2)));
      console.log(chalk.red(JSON.stringify(proj, null, 2)));
      throw new Error(`Projectile ${chalk.green(proj.id)} is not structurally identical!`);
    }

    return proj.id;
  }

  private _p(projectileId: TProjectileId): TProjectile {
    return this._gunProjectiles[projectileId];
  }

  private _buildModeFromProjectileModules(
    mode: string | number,
    gunDto: TGunDto,
    defaultModule: TProjectileModuleDto,
    moduleDtos: TProjectileModuleDto[],
  ): TProjectileMode {
    const volley: TProjectileModule[] = [];
    for (const moduleDto of moduleDtos) {
      const projectiles = moduleDto.projectiles
        .filter(this._assetService.referenceExists)
        .map((p) => this._buildProjectile(gunDto, p));

      if (moduleDto.sequenceStyle === ProjectileSequenceStyle.Random) {
        // TODO: handle random sequence
      } else {
        // TODO: handle other sequence styles
      }
      volley.push({
        shootStyle: shootStyleTextLookup[moduleDto.shootStyle] as keyof typeof ShootStyle,
        cooldownTime: moduleDto.cooldownTime,
        burstShotCount: moduleDto.burstShotCount,
        burstCooldownTime: moduleDto.burstCooldownTime,
        spread: moduleDto.angleVariance,
        ammoCost:
          moduleDto.ammoCost > 1 && defaultModule.shootStyle !== ShootStyle.Beam ? moduleDto.ammoCost : undefined,
        projectiles,
      });

      if (moduleDto.mirror) {
        volley.push(cloneDeep(volley.at(-1)!));
      }
    }
    let chargeTime = typeof mode === "number" ? mode : undefined;
    if (defaultModule.shootStyle === ShootStyle.Beam) {
      if (volley[0].projectiles.length > 1) {
        throw new Error(
          `Parsing ${gunDto.name} (${gunDto.gun.PickupObjectId}) gun failed: Beam gun must have only one type of projectile.`,
        );
      }
      chargeTime = Math.max(...volley.map((m) => m.projectiles.map((i) => this._p(i).beamChargeTime ?? 0)).flat());
    }
    return {
      mode: typeof mode === "number" ? `Charge ${mode}` : mode,
      magazineSize: defaultModule.numberOfShotsInClip === -1 ? gunDto.gun.maxAmmo : defaultModule.numberOfShotsInClip,
      chargeTime,
      volley,
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

    if (gunDto.trackInputDirectionalPad) {
      const hadoukenModules: TProjectileModuleDto[] = [];
      const inputModule = {
        ...defaultModule,
        shootStyle: ShootStyle.SemiAutomatic,
        ammoCost: defaultModule.burstShotCount,
      };
      for (let i = 0; i < projectileModules.length; i++) {
        hadoukenModules.push({ ...inputModule, projectiles: [gunDto.trackInputDirectionalPad.HadoukenProjectile] });
      }
      const grappleData = gunDto.trackInputDirectionalPad.grappleModule;
      const grappleModule: TProjectileModuleDto = { ...inputModule, projectiles: [grappleData.GrapplePrefab] };
      return [
        this._buildModeFromProjectileModules(`Normal`, gunDto, defaultModule, projectileModules),
        this._buildModeFromProjectileModules(`← ←`, gunDto, defaultModule, [...projectileModules, grappleModule]),
        this._buildModeFromProjectileModules(`↓ →`, gunDto, defaultModule, [...projectileModules, ...hadoukenModules]),
      ];
    }

    // TODO: handle fucking Starpew volley
    const chargeModuleDtosLookup = new Map<number, TProjectileModuleDto[]>();
    const normalModuleDtos: TProjectileModuleDto[] = [];
    for (const module of projectileModules) {
      if (module.shootStyle !== ShootStyle.Charged) {
        normalModuleDtos.push(module);
        continue;
      }

      const uniqChargeTimes = new Set(module.chargeProjectiles.map((p) => p.ChargeTime));
      if (uniqChargeTimes.size < module.chargeProjectiles.length) {
        throw new Error(
          `${gunDto.name}, A projectile module must not have multiple projectiles with the same charge time. This is undefined behavior`,
        );
      }

      for (const { ChargeTime, Projectile, AmmoCost } of module.chargeProjectiles) {
        if (!Projectile.guid) continue;
        if (!chargeModuleDtosLookup.get(ChargeTime)) chargeModuleDtosLookup.set(ChargeTime, []);

        const chargeModules = chargeModuleDtosLookup.get(ChargeTime)!;
        const clonedModule = cloneDeep(module);
        clonedModule.projectiles = [cloneDeep(Projectile)];
        clonedModule.ammoCost = AmmoCost;
        clonedModule.chargeProjectiles = [];
        chargeModules.push(clonedModule);
      }
    }
    const res: TProjectileMode[] = [];
    // TODO: rework estimated bounce damage, it only increases potential damage if paired with penetration.
    // TODO: ShovelGunModifier
    // TODO: some projectile like from GunBow have force: 0, which could be wrong. Investigating...
    // TODO: search for *modifier.cs to collect more attributes for the projectile
    // TODO: round that has explosion on impact count as another source of damage
    // TODO: Synergies: link 2 guns (e.g. NonSynergyGunId -> (SynergyGunId, PartnerGunID))
    //    ExportedProject/Assets/data/AAA_AdvSynergyManager.asset
    //    ExportedProject/Assets/Scripts/Assembly-CSharp/CustomSynergyType.cs
    // TODO: JK-47: fear effect
    // TODO: Banana Projectile: Handle bounce + spawn modifier
    // TODO: add a badge next to best stat: https://fontawesome.com/icons/medal?f=classic&s=solid
    // Edge cases:
    // TODO: Rad gun: update modified reload time & animation speed on each level
    // TODO: black hole gun reload sprites are not anchored correctly. Investigate reloadOffset
    //  Comparison: crossbow
    // TODO: add muzzleFlashEffects in idle animation for The Fat Line
    // TODO: add unused reload animation for The Fat Line (?)
    // TODO: add unused guns (requireDemoMode: 1). it doesn't have the Gun script, only sprites/animations. Create a separate model for demo gun.

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

    if (normalModuleDtos.length > 0) {
      res.push(this._buildModeFromProjectileModules("Default", gunDto, defaultModule, normalModuleDtos));
    }
    for (const [chargeTime, modules] of chargeModuleDtosLookup.entries()) {
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

      inputCombo: Boolean(gunDto.trackInputDirectionalPad) || undefined,
      trickGun: Boolean(gunDto.gun.IsTrickGun) || undefined,
    };

    if (gunDto.spawnItemOnGunDepletion && !gunDto.spawnItemOnGunDepletion.IsSynergyContingent) {
      attributes.spawnChestOnDepletion = true; // TODO: handle synergy
    }

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

  private _buildAnimationFromSprite(spriteData: TSpriteData, name?: string): TAnimation | undefined {
    if (!spriteData) return;

    const res = this._spriteService.getSprite(spriteData.collection.$$scriptPath, name ?? spriteData._spriteId);

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
      return this._buildAnimationFromSprite(
        projectileDto.sprite,
        projectileDto.id === "GrapplingHook" ? "scorpion_hook_chain_001" : undefined,
      );
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
            const projDto = this._getProjectileDto(gunDto, m);
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

    throw new Error(chalk.red(`No valid sprite found for gun ${gunDto.name}`));
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
      for (const module of modes.volley) {
        const projectileIds = new Set<TProjectileId>();
        for (const pId of module.projectiles) {
          if (this._p(pId).additionalDamage.length > 0) {
            this._featureFlags.add("hasMultipleDamageSources");
          }
          projectileIds.add(pId);
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
      this._gunProjectiles = {};

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
        gunNameInternal: gunDto.name,
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

      return {
        gun: GunForStorage.parse(this._postProcessGunModel(gun)),
        projectiles: Object.values(this._gunProjectiles).map((p) => ProjectileForStorage.parse(p)),
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(chalk.red(`Error parsing GUN pickup-object with ID ${entry.pickupObjectId}:`));
        console.error(z.prettifyError(error));
      }
      throw error;
    }
  }
}
