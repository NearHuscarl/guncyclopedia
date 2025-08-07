import { useEffect, useState } from "react";
import clsx from "clsx";
import { AnimatedSprite } from "../shared/components/animated-sprite";
import { H2, H3 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Tier } from "./tier";
import { StatBar } from "./stat-bar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Circle } from "./circle";
import { useAppState } from "../shared/hooks/useAppState";
import { useSelectedGun } from "../shared/hooks/useGuns";
import { useLoaderData } from "../shared/hooks/useLoaderData";
import { ProjectilesPerShot } from "./projectiles-per-shot";
import { GunService } from "@/client/service/gun.service";
import { ProjectileService } from "@/client/service/projectile.service";
import { useIsDebug } from "../shared/hooks/useDebug";
import { Tags } from "./tags";
import { StatStackBar } from "./stat-stack-bar";
import { basicColors } from "@/client/generated/models/color.model";

export function DetailSection() {
  const selectedId = useAppState((state) => state.selectedId);
  const gun = useSelectedGun();
  const debug = useIsDebug();
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
  const currentProjectileIndex = hoverProjectileIndex !== -1 ? hoverProjectileIndex : selectedProjectileIndex;

  useEffect(() => {
    // Note: Don't remove this useEffect and use key={gun?.id} for parent component
    // The state is needed to apply transitions for stats when switching guns
    setModeIndex(0);
  }, [gun?.id]);

  if (selectedId === -1 || !gun) {
    return null;
  }

  const { animation, name, ...other } = gun;
  const { dps, damage, reloadTime, magazineSize, mode, projectilePerShot, projectile } = GunService.computeGunStats(
    gun,
    modeIndex,
    currentProjectileIndex,
  );

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
        <blockquote className="flex justify-center w-full italic text-muted-foreground mb-4 font-sans font-semibold">
          {JSON.stringify(gun.quote)}
        </blockquote>
        <div className="flex justify-between items-baseline mb-6">
          <H2>{name}</H2>
          <Tier tier={gun.quality} />
        </div>
      </div>
      <div data-testid="detail-section-stats" className="overflow-y-auto flex-1 min-h-0 pr-2">
        {debug &&
          gun.animation.frames[0].colors.map((c) => {
            return (
              <div
                className="w-5 h-5 inline-block"
                title={c}
                style={{ backgroundColor: basicColors[c][1] ?? basicColors[c][0] }}
              />
            );
          })}
        <StatStackBar label="DPS" max={100} segments={dps.currentDetails} />
        <StatBar label="Magazine Size" value={magazineSize} max={Math.min(stats.maxMagazineSize, gun.maxAmmo)} />
        <StatBar
          label="Max Ammo"
          value={gun.featureFlags.includes("hasInfiniteAmmo") ? Infinity : gun.maxAmmo}
          max={stats.maxMaxAmmo}
        />
        <StatBar
          label="Reload Time"
          isNegativeStat
          value={reloadTime}
          max={stats.maxReloadTime}
          precision={2}
          unit="s"
        />
        {mode.chargeTime !== undefined && (
          <StatBar label="Charge Time" isNegativeStat value={mode.chargeTime} max={stats.maxChargeTime} unit="s" />
        )}
        <ProjectilesPerShot
          projectiles={mode.projectiles}
          onSelect={setSelectedProjectileIndex}
          onHover={setHoverProjectileIndex}
          onBlur={() => setHoverProjectileIndex(-1)}
          isSelected={(i) => hoverProjectileIndex === i || selectedProjectileIndex === i}
        />
        <StatStackBar label="Damage" segments={damage.currentDetails} max={100} />
        <StatBar
          label="Cooldown Time"
          isNegativeStat
          value={projectilePerShot.aggregated.cooldownTime}
          max={stats.maxCooldownTime}
          precision={2}
          modifier={projectilePerShot.current.cooldownTime - projectilePerShot.aggregated.cooldownTime}
          unit="s"
        />
        <StatBar
          label="Spread"
          isNegativeStat
          value={projectilePerShot.aggregated.spread}
          max={stats.maxSpread}
          modifier={projectilePerShot.current.spread - projectilePerShot.aggregated.spread}
          unit="°"
        />
        <StatBar
          label="Range"
          value={ProjectileService.getRange(projectile.aggregated.range)}
          max={100}
          modifier={ProjectileService.getRange(projectile.current.range - projectile.aggregated.range)}
        />
        <StatBar
          label="Speed"
          value={ProjectileService.getSpeed(projectile.aggregated.speed)}
          max={100}
          modifier={
            ProjectileService.getSpeed(projectile.current.speed) -
            ProjectileService.getSpeed(projectile.aggregated.speed)
          }
        />
        <StatBar
          label="Force"
          value={projectile.aggregated.force}
          max={50}
          modifier={projectile.current.force - projectile.aggregated.force}
        />
        <div className="mt-6">
          {projectilePerShot.current.projectiles.length > 1 && (
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
                {projectilePerShot.current.projectiles.map((p) => (
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
        <Tags gun={gun} />
        {debug && <pre className="text-left break-words whitespace-pre-wrap">{JSON.stringify(other, null, 2)}</pre>}
        <div className="h-14" />
      </div>
    </div>
  );
}
