import { useEffect, useState } from "react";
import clsx from "clsx";
import { AnimatedSprite } from "../shared/components/animated-sprite";
import { H2, H3 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Tier } from "./tier";
import { StatBar } from "./stat-bar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Circle } from "./circle";
import { createAggregatedProjectileData } from "@/client";
import { useAppState } from "../shared/hooks/useAppState";
import { useSelectedGun } from "../shared/hooks/useGuns";
import { useLoaderData } from "../shared/hooks/useLoaderData";
import type { TProjectilePerShot } from "@/client/generated/models/gun.model";

function getAggregatedProjectile(projectiles: TProjectilePerShot[]) {
  const pp = projectiles.map((p) => createAggregatedProjectileData(p.projectiles, "avg"));
  if (pp.length === 0) {
    throw new Error("Cannot compute average projectile from an empty list.");
  }
  const finalProjectile = {
    cooldownTime: 0,
    spread: 0,
    shootStyle: projectiles[0].shootStyle,
    projectiles: [createAggregatedProjectileData(pp, "sum")],
  };
  for (let i = 0; i < projectiles.length; i++) {
    const proj = projectiles[i];
    finalProjectile.cooldownTime = Math.max(finalProjectile.cooldownTime, proj.cooldownTime);
    finalProjectile.spread = Math.max(finalProjectile.spread, proj.spread);
  }

  return finalProjectile;
}

function getRange(value: number) {
  return value >= 1000 ? Infinity : value;
}
function getSpeed(value: number) {
  return value === -1 ? Infinity : value;
}

export function DetailSection() {
  const selectedId = useAppState((state) => state.selectedId);
  const gun = useSelectedGun();
  const stats = useLoaderData((state) => state.stats);
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

  if (selectedId === -1 || !gun) {
    return null;
  }

  const { animation, name, ...other } = gun;
  const mode = gun.projectileModes[modeIndex] ?? gun.projectileModes[0];
  const aggregatedProjectile = getAggregatedProjectile(mode.projectiles);
  const projectile = mode.projectiles[currentProjectileIndex] ?? aggregatedProjectile;
  const projectilePool = projectile.projectiles;
  const projData = createAggregatedProjectileData(projectilePool, "avg");
  const aggregatedProjData = aggregatedProjectile.projectiles[0];
  const magazineSize = mode.magazineSize === -1 ? gun.maxAmmo : mode.magazineSize;

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
        <StatBar label="Magazine Size" value={magazineSize} max={Math.min(stats.maxMagazineSize, gun.maxAmmo)} />
        <StatBar
          label="Max Ammo"
          value={gun.featureFlags.includes("hasInfiniteAmmo") ? Infinity : gun.maxAmmo}
          max={stats.maxMaxAmmo}
        />
        <StatBar
          label="Reload Time"
          isNegativeStat
          value={magazineSize === gun.maxAmmo ? 0 : gun.reloadTime}
          max={stats.maxReloadTime}
          unit="s"
        />
        {mode.chargeTime !== undefined && (
          <StatBar label="Charge Time" isNegativeStat value={mode.chargeTime} max={stats.maxChargeTime} unit="s" />
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
          <div className="flex gap-2 relative top-[3px]" onMouseLeave={() => setHoverProjectileIndex(-1)}>
            {mode.projectiles.map((p, i) => {
              return (
                <Tooltip key={i} delayDuration={800}>
                  <TooltipTrigger>
                    <Circle
                      isSelected={hoverProjectileIndex === i || selectedProjectileIndex === i}
                      onClick={() => setSelectedProjectileIndex(i)}
                      onMouseEnter={() => setHoverProjectileIndex(i)}
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
          unit="s"
        />
        <StatBar
          label="Spread"
          isNegativeStat
          value={aggregatedProjectile.spread}
          max={stats.maxSpread}
          modifier={projectile.spread - aggregatedProjectile.spread}
          unit="°"
        />
        <StatBar
          label="Damage"
          value={aggregatedProjData.damage}
          max={100}
          modifier={projData.damage - aggregatedProjData.damage}
        />
        <StatBar
          label="Range"
          value={getRange(aggregatedProjData.range)}
          max={100}
          modifier={getRange(projData.range - aggregatedProjData.range)}
        />
        <StatBar
          label="Speed"
          value={getSpeed(aggregatedProjData.speed)}
          max={100}
          modifier={getSpeed(projData.speed) - getSpeed(aggregatedProjData.speed)}
        />
        <StatBar
          label="Force"
          value={aggregatedProjData.force}
          max={50}
          modifier={projData.force - aggregatedProjData.force}
        />
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
