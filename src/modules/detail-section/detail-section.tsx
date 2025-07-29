import { useState } from "react";
import clsx from "clsx";
import { useLoaderData } from "@tanstack/react-router";
import { useUiStore } from "../shared/store/ui.store";
import { AnimatedSprite } from "../shared/components/animated-sprite";
import { H2, H3 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Tier } from "./tier";
import { StatBar } from "./stat-bar";
import type { TProjectilePerShot } from "@/client/generated/models/gun.model";

function getProjectileData(projectiles: TProjectilePerShot[], projectilePerShotIndex: number) {
  if (projectilePerShotIndex === -1) {
    const res: TProjectilePerShot = {
      cooldownTime: 0,
      spread: 0,
      shootStyle: projectiles[0].shootStyle,
      projectiles: projectiles[0].projectiles,
    };

    for (const proj of projectiles) {
      res.cooldownTime = Math.max(res.cooldownTime, proj.cooldownTime);
      res.spread = Math.max(res.spread, proj.spread);
    }

    return res;
  }

  return projectiles[projectilePerShotIndex];
}

export function DetailSection() {
  const { guns } = useLoaderData({ from: "/" });
  const selectedItemId = useUiStore((state) => state.selectedItemId);
  const { stats } = useLoaderData({ from: "/" });
  const gun = guns.find((gun) => gun.id === selectedItemId);
  const [modeIndex, _setModeIndex] = useState(0);
  const [projectilePerShotIndex, setProjectilePerShotIndex] = useState(-1);
  const setModeIndex = (index: number) => {
    _setModeIndex(index);
    setProjectilePerShotIndex(-1); // Reset projectile per shot index when mode changes
  };

  if (selectedItemId === -1 || !gun) {
    return null;
  }

  const { animation, name, ...other } = gun;
  const mode = gun.projectileModes[modeIndex];
  const projectilePerShot = getProjectileData(mode.projectiles, projectilePerShotIndex);
  console.log({ stats });

  return (
    <div className="p-2">
      <div className="flex justify-center gap-1">
        {gun.projectileModes.map(({ mode }, i, modes) => (
          <Button
            key={mode}
            variant="secondary"
            onClick={() => setModeIndex(i)}
            className={clsx({
              "rounded-none font-semibold": true,
              "rounded-l-md": i === 0,
              "bg-primary text-black focus:bg-primary": i === modeIndex,
              "rounded-r-md": i === modes.length - 1,
              invisible: modes.length === 1,
            })}
          >
            {mode}
          </Button>
        ))}
      </div>
      <div className="flex items-center justify-center h-36">
        <AnimatedSprite key={gun.id} animation={animation} scale={6} />
      </div>
      <div className="flex justify-between items-baseline mb-6">
        <H2>{name}</H2>
        <Tier tier={gun.quality} />
      </div>
      <StatBar
        label="Magazine Size"
        value={mode.magazineSize === -1 ? gun.maxAmmo : mode.magazineSize}
        max={stats.maxMagazineSize}
      />
      <StatBar label="Max Ammo" value={gun.maxAmmo} max={stats.maxMaxAmmo} />
      <StatBar label="Reload Time" negativeStat value={gun.reloadTime} max={stats.maxReloadTime} />
      {mode.chargeTime !== undefined && (
        <StatBar label="Charge Time" negativeStat value={mode.chargeTime} max={stats.maxChargeTime} />
      )}
      <div className="flex justify-between items-baseline">
        <H3 className="mt-6 mb-4">Projectile Stats</H3>
        <div className="flex gap-2 relative top-[3px]">
          {mode.projectiles.map((_, i) => {
            return <div key={i} role="button" className="w-5 h-5 bg-stone-800 rounded-full cursor-pointer" />;
          })}
        </div>
      </div>
      <StatBar label="Cooldown Time" negativeStat value={projectilePerShot.cooldownTime} max={stats.maxCooldownTime} />
      <StatBar label="Spread" negativeStat value={projectilePerShot.spread} max={stats.maxSpread} />
      <pre className="text-left break-words whitespace-pre-wrap">{JSON.stringify(other, null, 2)}</pre>
    </div>
  );
}
