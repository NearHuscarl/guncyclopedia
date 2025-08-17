import assert from "node:assert";
import chalk from "chalk";
import z from "zod/v4";
import invert from "lodash/invert.js";
import countBy from "lodash/countBy.js";
import keyBy from "lodash/keyBy.js";
import cloneDeep from "lodash/cloneDeep.js";
import { GunClass, ItemQuality, ProjectileSequenceStyle, ShootStyle } from "../gun/gun.dto.ts";
import { videos } from "../gun/gun.meta.ts";
import { Gun } from "./client/models/gun.model.ts";
import { TranslationRepository } from "../translation/translation.repository.ts";
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
import { SpriteRepository } from "../sprite/sprite.repository.ts";
import type { TEnconterDatabase } from "../encouter-trackable/encounter-trackable.dto.ts";
import type { TGun, TProjectile, TProjectileMode, TProjectilePerShot } from "./client/models/gun.model.ts";
import type { TGunDto, TProjectileModule } from "../gun/gun.dto.ts";
import type { TVolleyDto } from "../gun/volley.dto.ts";
import type { TAssetExternalReference } from "../utils/schema.ts";
import type { TProjectileDto } from "../gun/projectile.dto.ts";
import type { TAnimation } from "./client/models/animation.model.ts";
import type { TSpriteAnimatorData } from "../gun/component.dto.ts";

const gunQualityTextLookup = invert(ItemQuality);
const gunClassTextLookup = invert(GunClass);
const shootStyleTextLookup = invert(ShootStyle);
const modifyMethodTextLookup = invert(StatModifier.ModifyMethod);
const statTypeTextLookup = invert(StatModifier.StatType);
const wrapModeTextLookup = invert(WrapMode);

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
  assetService: AssetService;
  spriteService: SpriteService;
  spriteAnimatorRepo: SpriteAnimatorRepository;
};

export class GunModelGenerator {
  private readonly _gunRepo: GunRepository;
  private readonly _projectileRepo: ProjectileRepository;
  private readonly _volleyRepo: VolleyRepository;
  private readonly _translationRepo: TranslationRepository;
  private readonly _assetService: AssetService;
  private readonly _spriteService: SpriteService;
  private readonly _spriteAnimatorRepo: SpriteAnimatorRepository;
  private readonly _colorService = new ColorService();
  private readonly _featureFlags: Set<TGun["featureFlags"][number]> = new Set();

  private constructor(input: GunModelGeneratorCtor) {
    this._gunRepo = input.gunRepo;
    this._projectileRepo = input.projectileRepo;
    this._volleyRepo = input.volleyRepo;
    this._translationRepo = input.translationRepo;
    this._assetService = input.assetService;
    this._spriteService = input.spriteService;
    this._spriteAnimatorRepo = input.spriteAnimatorRepo;
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

  private _getGunVolley(gunDto: TGunDto): TVolleyDto | undefined {
    if (!this._assetService.referenceExists(gunDto.gun.rawVolley)) {
      return undefined;
    }

    const volleyDto = this._volleyRepo.getVolley(gunDto.gun.rawVolley);
    if (!volleyDto) {
      throw new Error(
        `Parsing ${gunDto.gun.gunName} (${gunDto.gun.PickupObjectId}) gun failed: Volley with guid ${gunDto.gun.rawVolley.guid} not found in VolleyRepository.`,
      );
    }
    return volleyDto;
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
    const volleyDto = this._getGunVolley(gunDto);
    const modulesAreTiers = Boolean(volleyDto?.ModulesAreTiers);
    const projectileModules = volleyDto ? volleyDto.projectiles : [gunDto.gun.singleModule];

    // see Gun.cs#DefaultModule. Some attributes within the module like numberOfShotsInClip/shootStyle
    // should be tied to a gun, not the projectile data. DefaultModule is used to retrieve those attributes
    // for the gun model
    const defaultModule = projectileModules[0];

    // each module is a separate mode
    if (modulesAreTiers) {
      this._featureFlags.add("hasTieredProjectiles");
      return projectileModules.map((mod, i) =>
        this._buildModeFromProjectileModules(`Lvl ${i + 1}`, gunDto, defaultModule, [mod]),
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
          `${gunDto.gun.gunName}, A projectile module must not have multiple projectiles with the same charge time. This is undefined behavior`,
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
    // TODO: SpawnProjModifier (The Scrambler, Particulator)
    // TODO: homing bullet
    // TODO: handle explosionData. See CerebralBoreProjectile.prefab
    // TODO: trick gun (Gungeon Ant)
    // TODO: search for *modifier.cs to collect more attributes for the projectile
    // TODO: round that has explosion on impact count as another source of damage
    // TODO: link 2 guns (e.g. Gun with EXCLUDED or SPECIAL quality)
    // TODO: fear effect
    // Edge cases:
    // Gungeon Ant: calculate reload time again based on the active reload multiplier
    // Rad Gun: create 2 modes for different type of projectiles when alternate reloading

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
    };

    for (const value of Object.values(attributes)) {
      if (value === true) {
        this._featureFlags.add("hasSpecialAbilities");
      }
    }

    return attributes;
  }

  private _buildAnimation(spriteAnimatorData: TSpriteAnimatorData, debugId: string) {
    const { library, defaultClipId } = spriteAnimatorData;
    const clip = this._spriteAnimatorRepo.getClipByIndex(library, defaultClipId);
    const frames: TAnimation["frames"] = [];
    let texturePath = "";

    for (let i = 0; i < clip.frames.length; i++) {
      const frame = clip.frames[i];
      const { spriteData, texturePath: frameTexturePath } = this._spriteService.getSpriteSync(
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
        spriteName: spriteData.name,
        uvs: spriteData.uvs,
        spriteId: frame.spriteId,
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

  private _buildProjectileAnimation(projectileDto: TProjectileDto): TAnimation | undefined {
    if (projectileDto.spriteAnimator) {
      return this._buildAnimation(projectileDto.spriteAnimator, `projectile id: ${projectileDto.id}`);
    }
    if (projectileDto.sprite) {
      const res = this._spriteService.getSpriteSync(
        projectileDto.sprite.collection.$$scriptPath,
        projectileDto.sprite._spriteId,
      );

      return {
        name: "No_Animation",
        fps: 0,
        loopStart: 0,
        texturePath: res.texturePath,
        wrapMode: "Single",
        minFidgetDuration: 0,
        maxFidgetDuration: 0,
        frames: [
          {
            spriteName: res.spriteData.name,
            spriteId: projectileDto.sprite._spriteId,
            uvs: res.spriteData.uvs,
            flipped: Boolean(res.spriteData.flipped),
          },
        ],
      };
    }
    console.log(chalk.yellow(`No sprite animator or sprite found for projectile ${chalk.green(projectileDto.id)}`));
  }

  private async _buildGunAnimation(gunDto: TGunDto): Promise<{ colors: string[]; animation: TAnimation }> {
    const animationName = gunDto.gun.idleAnimation;
    let colors: string[] = [];

    if (animationName) {
      let texturePath = "";
      const clip = this._spriteAnimatorRepo.getClip(gunDto.spriteAnimator.library, animationName);
      const frames: TAnimation["frames"] = [];

      if (clip) {
        for (let i = 0; i < clip.frames.length; i++) {
          const frame = clip.frames[i];
          const { spriteData, texturePath: spriteTexturePath } = await this._spriteService.getSprite(
            frame.spriteCollection.$$scriptPath,
            frame.spriteId,
            async (image) =>
              void (i === 0 && (colors = await this._colorService.findDominantColors(image, basicColors))),
          );
          if (!spriteData.name) {
            throw new Error(
              `Sprite data is missing a name for frame ${frame.spriteId} of clip ${chalk.green(animationName)}`,
            );
          }
          frames.push({
            spriteName: spriteData.name,
            uvs: spriteData.uvs,
            spriteId: frame.spriteId,
            flipped: Boolean(spriteData.flipped),
          });
          if (texturePath) {
            assert(texturePath === spriteTexturePath, "All frames must have the same texture path");
          } else {
            texturePath = spriteTexturePath;
          }
        }

        return {
          colors,
          animation: {
            name: clip.name!,
            fps: clip.fps,
            loopStart: clip.loopStart,
            wrapMode: wrapModeTextLookup[clip.wrapMode] as keyof typeof WrapMode,
            minFidgetDuration: clip.minFidgetDuration,
            maxFidgetDuration: clip.maxFidgetDuration,
            texturePath,
            frames,
          },
        };
      } else {
        console.warn(
          chalk.yellow(
            `Clip ${chalk.green(animationName)} not found in animation collection. Falling back to Ammonomicon sprite.`,
          ),
        );
      }
    }

    const spriteName = gunDto.encounterTrackable?.m_journalData.AmmonomiconSprite;

    if (!spriteName) {
      throw new Error(chalk.red(`No valid sprite found for gun ${gunDto.gun.gunName}`));
    }
    let res: Awaited<ReturnType<typeof this._spriteService.getSprite>> | null = null;
    try {
      res = await this._spriteService.getSprite(
        gunDto.sprite.collection.$$scriptPath,
        spriteName,
        async (image) => void (colors = await this._colorService.findDominantColors(image, basicColors)),
      );
    } catch {
      res = await this._spriteService.getSprite(
        SpriteRepository.AMMONONICON_SPRITE_PATH,
        spriteName,
        async (image) => void (colors = await this._colorService.findDominantColors(image, basicColors)),
      );
    }

    return {
      colors,
      animation: {
        name: "No_Animation",
        fps: 0,
        loopStart: 0,
        texturePath: res.texturePath,
        wrapMode: "Single",
        minFidgetDuration: 0,
        maxFidgetDuration: 0,
        frames: [
          {
            spriteName: res.spriteData.name,
            spriteId: -1, // no sprite ID
            uvs: res.spriteData.uvs,
            flipped: Boolean(res.spriteData.flipped),
          },
        ],
      },
    };
  }

  async generate(entry: TEnconterDatabase["Entries"][number]) {
    try {
      this._featureFlags.clear();

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

      if (entry.isInfiniteAmmoGun) this._featureFlags.add("hasInfiniteAmmo");
      if (entry.doesntDamageSecretWalls) this._featureFlags.add("doesntDamageSecretWalls");

      const allStatModifiers = gunDto.gun.currentGunStatModifiers.concat(gunDto.gun.passiveStatModifiers ?? []);

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
      const gun: TGun = {
        ...texts,
        type: "gun",
        id: entry.pickupObjectId,
        gunNameInternal: gunDto.gun.gunName,
        quality: gunQualityTextLookup[gunDto.gun.quality] as keyof typeof ItemQuality,
        gunClass: gunClassTextLookup[gunDto.gun.gunClass] as keyof typeof GunClass,
        playerStatModifiers: allStatModifiers.map((m) => ({
          statToBoost: statTypeTextLookup[m.statToBoost] as keyof typeof StatModifier.StatType,
          modifyType: modifyMethodTextLookup[m.modifyType] as keyof typeof StatModifier.ModifyMethod,
          amount: m.amount,
        })),
        maxAmmo: gunDto.gun.maxAmmo,
        reloadTime: gunDto.gun.reloadTime,
        featureFlags: [],
        projectileModes: this._buildProjectileModes(gunDto),
        attribute: this._buildAttribute(gunDto),
        ...(await this._buildGunAnimation(gunDto)),
        video: videos.has(entry.pickupObjectId) ? videos.get(entry.pickupObjectId) : undefined,
      };

      // postprocess gun
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
      return Gun.parse(gun);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(chalk.red(`Error parsing GUN pickup-object with ID ${entry.pickupObjectId}:`));
        console.error(z.prettifyError(error));
      }
      throw error;
    }
  }
}
