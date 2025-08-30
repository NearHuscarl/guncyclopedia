import { GameObjectService } from "./service/game-object.service";
import type { TGun } from "./generated/models/gun.model";

export function getGunStats() {
  const guns = GameObjectService.getGuns();
  const featureSet = new Set<TGun["featureFlags"][number]>();
  let maxReloadTime = 0;
  let maxMagazineSize = 0;
  let maxChargeTime = 0;
  let maxCooldownTime = 0;

  for (const gun of guns) {
    maxReloadTime = Math.max(maxReloadTime, gun.reloadTime);
    gun.featureFlags.forEach((flag) => featureSet.add(flag));

    for (const mode of gun.projectileModes) {
      if (mode.magazineSize !== gun.maxAmmo) {
        maxMagazineSize = Math.max(maxMagazineSize, mode.magazineSize);
      }
      if (mode.chargeTime !== undefined) {
        maxChargeTime = Math.max(maxChargeTime, mode.chargeTime);
      }
      for (const projectile of mode.volley) {
        maxCooldownTime = Math.max(maxCooldownTime, projectile.cooldownTime);
      }
    }
  }

  return {
    guns,
    stats: {
      maxMaxAmmo: 1000,
      maxReloadTime,
      maxMagazineSize: Math.min(maxMagazineSize, 100),
      maxChargeTime,
      maxCooldownTime: Math.min(maxCooldownTime, 0.5),
      features: Array.from(featureSet).sort(),
    },
  };
}
