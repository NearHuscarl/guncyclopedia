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
import { Circle } from "./circle";
import { computeAverageProjectile } from "@/client";
import type { TProjectile, TProjectilePerShot } from "@/client/generated/models/gun.model";

function getProjectile(projectiles: TProjectilePerShot[]) {
  const pp = projectiles.map((p) => p.projectiles).flat();
  if (pp.length === 0) {
    throw new Error("Cannot compute average projectile from an empty list.");
  }
  const finalProjectile = {
    cooldownTime: 0,
    spread: 0,
    shootStyle: projectiles[0].shootStyle,
    projectiles: [computeAverageProjectile(pp as [TProjectile, ...TProjectile[]])],
  };
  for (let i = 0; i < projectiles.length; i++) {
    const proj = projectiles[i];
    finalProjectile.cooldownTime = Math.max(finalProjectile.cooldownTime, proj.cooldownTime);
    finalProjectile.spread += proj.spread;
  }
  finalProjectile.spread /= projectiles.length;

  return finalProjectile;
}

export function DetailSection() {
  const { guns } = useLoaderData({ from: "/" });
  const selectedItemId = useUiStore((state) => state.selectedItemId);
  const gun = guns.find((gun) => gun.id === selectedItemId);
  const { stats } = useLoaderData({ from: "/" });
  const [modeIndex, _setModeIndex] = useState(0);
  const [hoverProjectileIndex, setHoverProjectileIndex] = useState(-1);
  const [selectedProjectileIndex, _setSelectedProjectileIndex] = useState(-1);
  const setModeIndex = (index: number) => {
    _setModeIndex(index);
    // Reset projectile index when mode changes
    setHoverProjectileIndex(-1);
    _setSelectedProjectileIndex(-1);
  };
  const setSelectedProjectileIndex = (index: number) => {
    _setSelectedProjectileIndex(index === selectedProjectileIndex ? -1 : index);
  };
  const currentProjectileIndex = hoverProjectileIndex === -1 ? selectedProjectileIndex : hoverProjectileIndex;

  useEffect(() => {
    // Note: Don't remove this useEffect and use key={gun?.id} for parent component
    // The state is needed to apply transitions for stats when switching guns
    setModeIndex(0);
  }, [gun?.id]);

  if (selectedItemId === -1 || !gun) {
    return null;
  }

  const { animation, name, ...other } = gun;
  const mode = gun.projectileModes[modeIndex] ?? gun.projectileModes[0];
  const aggregatedProjectile = getProjectile(mode.projectiles);
  const projectile = mode.projectiles[currentProjectileIndex] ?? aggregatedProjectile;
  const projectilePool = projectile.projectiles;
  const averageProjectileData = mode.projectiles[currentProjectileIndex]
    ? computeAverageProjectile(mode.projectiles[currentProjectileIndex].projectiles as [TProjectile, ...TProjectile[]])
    : aggregatedProjectile.projectiles[0];

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
        <StatBar
          label="Max Ammo"
          value={gun.featureFlags.includes("hasInfiniteAmmo") ? Infinity : gun.maxAmmo}
          max={stats.maxMaxAmmo}
        />
        <StatBar label="Reload Time" isNegativeStat value={gun.reloadTime} max={stats.maxReloadTime} />
        {mode.chargeTime !== undefined && (
          <StatBar label="Charge Time" isNegativeStat value={mode.chargeTime} max={stats.maxChargeTime} />
        )}
        <div className="flex gap-4 items-baseline mt-6">
          <Tooltip>
            <TooltipTrigger>
              <H3 className="mb-4 border-b border-dashed border-stone-400/30 cursor-help">Projectiles per shot:</H3>
            </TooltipTrigger>
            <TooltipContent>
              <p>Each circle represents a projectile per shot</p>
            </TooltipContent>
          </Tooltip>
          <div className="flex gap-2 relative top-[3px]">
            {mode.projectiles.map((p, i) => {
              return (
                <Tooltip key={i} delayDuration={800}>
                  <TooltipTrigger>
                    <Circle
                      isSelected={hoverProjectileIndex === i || selectedProjectileIndex === i}
                      onClick={() => setSelectedProjectileIndex(i)}
                      onMouseEnter={() => setHoverProjectileIndex(i)}
                      onMouseLeave={() => setHoverProjectileIndex(-1)}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    {p.projectiles.length === 1 && <p>{p.projectiles[0].id}</p>}
                    {p.projectiles.length > 1 && (
                      <div>
                        <p>Pick one of the following projectiles from the pool for this shot:</p>
                        <ul className="my-2 ml-3 list-disc [&>li]:mt-2">
                          {p.projectiles.map((proj) => (
                            <li key={proj.id}>{proj.id}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
        <StatBar
          label="Cooldown Time"
          isNegativeStat
          value={aggregatedProjectile.cooldownTime}
          max={stats.maxCooldownTime}
          modifier={projectile.cooldownTime - aggregatedProjectile.cooldownTime}
        />
        <StatBar
          label="Spread"
          isNegativeStat
          value={aggregatedProjectile.spread}
          max={stats.maxSpread}
          modifier={projectile.spread - aggregatedProjectile.spread}
        />
        <StatBar label="Damage" value={averageProjectileData.damage} max={100} />
        <StatBar
          label="Range"
          value={averageProjectileData.range === 1000 ? Infinity : averageProjectileData.range}
          max={100}
        />
        <StatBar
          label="Speed"
          value={averageProjectileData.speed === -1 ? Infinity : averageProjectileData.speed}
          max={100}
        />
        {/* TODO: incorrect force calculation for shotgun, should be sum of all projectiles */}
        <StatBar label="Force" value={averageProjectileData.force} max={50} />
        <div className="mt-6">
          {projectilePool.length > 1 && (
            <div className="flex gap-4 items-baseline">
              <Tooltip>
                <TooltipTrigger>
                  <H3 className="mb-4 border-b border-dashed border-stone-400/30 cursor-help">Projectile pool:</H3>
                </TooltipTrigger>
                <TooltipContent>
                  {/* TODO: random or sequential */}
                  <p>List of projectiles to choose from when firing a single projectile</p>
                </TooltipContent>
              </Tooltip>
              <div className="flex gap-2 relative top-[3px]">
                {projectilePool.map((p) => (
                  <Tooltip key={p.id}>
                    <TooltipTrigger>
                      <Circle />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{p.id}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          )}
        </div>
        <pre className="text-left break-words whitespace-pre-wrap">{JSON.stringify(other, null, 2)}</pre>
      </div>
    </div>
  );
}
