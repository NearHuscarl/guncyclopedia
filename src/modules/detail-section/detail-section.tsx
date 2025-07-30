import { useEffect, useState } from "react";
import clsx from "clsx";
import { useLoaderData } from "@tanstack/react-router";
import { useUiStore } from "../shared/store/ui.store";
import { AnimatedSprite } from "../shared/components/animated-sprite";
import { H2, H3 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Tier } from "./tier";
import { StatBar } from "./stat-bar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { TProjectilePerShot } from "@/client/generated/models/gun.model";

function getProjectileData(projectiles: TProjectilePerShot[]) {
  const res: TProjectilePerShot = {
    cooldownTime: 0,
    spread: 0,
    shootStyle: projectiles[0].shootStyle,
    projectiles: projectiles[0].projectiles,
  };

  for (const proj of projectiles) {
    res.cooldownTime = Math.max(res.cooldownTime, proj.cooldownTime);
    res.spread += proj.spread;
  }
  res.spread /= projectiles.length;

  return res;
}

export function DetailSection() {
  const { guns } = useLoaderData({ from: "/" });
  const selectedItemId = useUiStore((state) => state.selectedItemId);
  const gun = guns.find((gun) => gun.id === selectedItemId);
  const { stats } = useLoaderData({ from: "/" });
  const [modeIndex, _setModeIndex] = useState(0);
  const [projectilePerShotIndex, setProjectilePerShotIndex] = useState(-1);
  const setModeIndex = (index: number) => {
    _setModeIndex(index);
    setProjectilePerShotIndex(-1); // Reset projectile per shot index when mode changes
  };

  useEffect(() => {
    setModeIndex(0);
  }, [gun?.id]);

  if (selectedItemId === -1 || !gun) {
    return null;
  }

  const { animation, name, ...other } = gun;
  const mode = gun.projectileModes[modeIndex] ?? gun.projectileModes[0];
  const finalProjectile = getProjectileData(mode.projectiles);
  const projectile = mode.projectiles[projectilePerShotIndex] ?? finalProjectile;

  return (
    <div className="p-2 pr-0 h-full flex flex-col min-h-0">
      <div>
        <div className="flex justify-center gap-1">
          {gun.projectileModes.map(({ mode }, i, modes) => (
            <Button
              key={mode}
              variant="secondary"
              onClick={() => setModeIndex(i)}
              className={clsx({
                "rounded-none font-semibold transition-colors": true,
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
      </div>
      <div data-testid="detail-section-stats" className="overflow-y-auto flex-1 min-h-0 pr-2">
        <StatBar
          label="Magazine Size"
          value={mode.magazineSize === -1 ? gun.maxAmmo : mode.magazineSize}
          max={Math.min(stats.maxMagazineSize, gun.maxAmmo)}
        />
        <StatBar label="Max Ammo" value={gun.maxAmmo} max={stats.maxMaxAmmo} />
        <StatBar label="Reload Time" isNegativeStat value={gun.reloadTime} max={stats.maxReloadTime} />
        {mode.chargeTime !== undefined && (
          <StatBar label="Charge Time" isNegativeStat value={mode.chargeTime} max={stats.maxChargeTime} />
        )}
        <div className="flex justify-between items-baseline">
          <H3 className="mt-6 mb-4">Projectile Stats</H3>
          <div className="flex gap-2 relative top-[3px]">
            {mode.projectiles.map((_, i) => {
              return (
                <Tooltip delayDuration={1000}>
                  <TooltipTrigger>
                    <div
                      key={i}
                      className={clsx({
                        "w-5 h-5 bg-stone-800 rounded-full cursor-pointer": true,
                        "bg-primary! focus:bg-primary": projectilePerShotIndex === i,
                      })}
                      onMouseEnter={() => setProjectilePerShotIndex(i)}
                      onMouseLeave={() => setProjectilePerShotIndex(-1)}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Each circle represents a projectile per shot</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
        <StatBar
          label="Cooldown Time"
          isNegativeStat
          value={finalProjectile.cooldownTime}
          max={stats.maxCooldownTime}
          modifier={projectile.cooldownTime - finalProjectile.cooldownTime}
        />
        <StatBar
          label="Spread"
          isNegativeStat
          value={finalProjectile.spread}
          max={stats.maxSpread}
          modifier={projectile.spread - finalProjectile.spread}
        />
        <pre className="text-left break-words whitespace-pre-wrap">{JSON.stringify(other, null, 2)}</pre>
      </div>
    </div>
  );
}
