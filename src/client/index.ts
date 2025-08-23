import memoize from "lodash/memoize";
import pickupObjects from "./generated/data/pickup-objects.json";
import { isGun } from "./generated/helpers/types";
import { GunFromStorage, type TGun } from "./generated/models/gun.model";
import type { TPickupObject } from "./generated/models/pickup-object.model";

export const getPickupObjects = (): TPickupObject[] => {
  return pickupObjects as TPickupObject[];
};

export const getGuns = memoize((): TGun[] => {
  return getPickupObjects()
    .filter(isGun)
    .map((p) => GunFromStorage.parse(p));
});

export function getGunStats() {
  const guns = getGuns();
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
      for (const projectile of mode.projectiles) {
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
