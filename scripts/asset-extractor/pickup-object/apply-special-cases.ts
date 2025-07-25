import type { TGun } from "./gun.model.ts";

/**
 * Applies special cases for specific guns cause I'm too lazy to handle them in the main logic.
 */
export function applySpecialCases(gun: TGun) {
  switch (gun.id) {
    case 331: // Science Cannon
      // ExportedProject/Assets/data/projectiles/beams/Disintegrator_Beam.prefab
      gun.projectileModes[0].projectiles[0].projectiles[0].statusEffectChancePerSecond = 0.6;
      break;
  }

  return gun;
}
