import { useEffect, useState } from "react";
import clsx from "clsx";
import { AnimatedSprite } from "../shared/components/animated-sprite";
import { H2, H3, Muted } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Tier } from "./tier";
import { StatBar } from "./stat-bar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Circle } from "./circle";
import { useAppState } from "../shared/hooks/useAppState";
import { useHoverGun, useSelectedGun } from "../shared/hooks/useGuns";
import { useLoaderData } from "../shared/hooks/useLoaderData";
import { ProjectilesPerShot } from "./projectiles-per-shot";
import { GunService } from "@/client/service/gun.service";
import { ProjectileService } from "@/client/service/projectile.service";
import { useIsDebug } from "../shared/hooks/useDebug";
import { Tags } from "./tags";
import { StatStackBar } from "./stat-stack-bar";
import { basicColors } from "@/client/generated/models/color.model";
import { ArrowLeftRight } from "lucide-react";
import { NumericValue } from "./numeric-value";
import { formatNumber } from "@/lib/lang";
import { ShootingStyle } from "./shooting-style";

export function DetailSection() {
  const selectedId = useAppState((state) => state.selectedId);
  const gun = useSelectedGun();
  const hoverGun = useHoverGun();
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
  const gunStats = GunService.computeGunStats(gun, modeIndex, currentProjectileIndex);
  const hoverGunStats = hoverGun ? GunService.computeGunStats(hoverGun, modeIndex, currentProjectileIndex) : gunStats;

  return (
    <div className="p-2 pr-0 h-full flex flex-col min-h-0">
      <div className="pr-2">
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
        <div className="flex items-center justify-center h-36 gap-10">
          <AnimatedSprite key={gun.id} animation={animation} scale={6} />
          {hoverGun && hoverGun.id !== gun.id && (
            <>
              <ArrowLeftRight className="fill-primary" />
              <AnimatedSprite key={hoverGun.id} animation={hoverGun.animation} scale={6} />
            </>
          )}
        </div>
        <blockquote className="flex justify-center w-full italic text-muted-foreground mb-4 font-sans font-semibold">
          {JSON.stringify(gun.quote)}
        </blockquote>
        <div className="flex justify-between items-baseline">
          <H2>{name || "N/A"}</H2>
          <div>
            {debug &&
              gun.animation.frames[0].colors.map((c) => {
                return (
                  <div
                    key={c}
                    className="w-5 h-5 inline-block"
                    title={c}
                    style={{ backgroundColor: basicColors[c][1] ?? basicColors[c][0] }}
                  />
                );
              })}
          </div>
          <Tier tier={gun.quality} />
        </div>
      </div>
      <div className="flex justify-between items-baseline pr-2 mb-6">
        <Muted className="font-semibold uppercase">{gunStats.shootingStyle}</Muted>
        <div className="flex gap-2 align-baseline">
          <Tooltip>
            <TooltipTrigger>
          <NumericValue>
            {gunStats.magazineSize}/{formatNumber(gunStats.maxAmmo)}
          </NumericValue>
            </TooltipTrigger>
            <TooltipContent>Magazine Size / Max Ammunition.</TooltipContent>
          </Tooltip>
          <ShootingStyle shootingStyle={gunStats.shootingStyle} magazineSize={gunStats.magazineSize} />
        </div>
      </div>
      <div data-testid="detail-section-stats" className="overflow-y-auto flex-1 min-h-0 pr-2">
        <StatStackBar
          label="DPS"
          max={100}
          segments={gunStats.dps.details}
          modifier={hoverGunStats.dps.base - gunStats.dps.base}
        />
        <StatBar
          label="Magazine Size"
          value={gunStats.magazineSize}
          max={Math.min(stats.maxMagazineSize, gun.maxAmmo)}
          modifier={hoverGunStats.magazineSize - gunStats.magazineSize}
        />
        <StatBar
          label="Max Ammo"
          value={gunStats.maxAmmo}
          max={stats.maxMaxAmmo}
          modifier={hoverGunStats.maxAmmo - gunStats.maxAmmo}
        />
        <StatBar
          label="Reload Time"
          isNegativeStat
          value={gunStats.reloadTime}
          max={stats.maxReloadTime}
          precision={2}
          modifier={hoverGunStats.reloadTime - gunStats.reloadTime}
          unit="s"
        />
        {/* {gunStats.mode.chargeTime !== undefined && (
          <StatBar
            label="Charge Time"
            isNegativeStat
            value={gunStats.mode.chargeTime}
            max={stats.maxChargeTime}
            modifier={(hoverGunStats.mode.chargeTime ?? gunStats.mode.chargeTime) - gunStats.mode.chargeTime}
            unit="s"
          />
        )} */}
        <ProjectilesPerShot
          projectiles={gunStats.mode.projectiles}
          onSelect={setSelectedProjectileIndex}
          onHover={setHoverProjectileIndex}
          onBlur={() => setHoverProjectileIndex(-1)}
          isSelected={(i) => hoverProjectileIndex === i || selectedProjectileIndex === i}
        />
        <StatStackBar
          label="Damage"
          max={100}
          segments={gunStats.damage.details}
          modifier={hoverGunStats.damage.base - gunStats.damage.base}
        />
        <StatBar
          label="Fire Rate"
          labelTooltip="Number of shots fired per minute. Calculation includes the <strong>cooldown time</strong>, <strong>charge time</strong> and <strong>reload time</strong>"
          max={1000}
          precision={0}
          value={gunStats.fireRate}
          modifier={hoverGunStats.fireRate - gunStats.fireRate}
        />
        <StatBar
          label="Precision"
          labelTooltip={`Spread: <strong>${gunStats.projectilePerShot.spread}°</strong><br/>Higher precision results in less bullet spread. Scales the spread range [30deg (worst) .. 0 (best)] into a precision percentage [0 (worst) .. 100 (best)]`}
          value={gunStats.precision}
          precision={0}
          max={100}
          modifier={hoverGunStats.precision - gunStats.precision}
        />
        <StatBar
          label="Range"
          value={gunStats.projectile.range}
          max={100}
          valueResolver={ProjectileService.getRange}
          modifier={hoverGunStats.projectile.range - gunStats.projectile.range}
        />
        <StatBar
          label="Speed"
          value={ProjectileService.getSpeed(gunStats.projectile.speed)}
          max={100}
          modifier={
            ProjectileService.getSpeed(hoverGunStats.projectile.speed) -
            ProjectileService.getSpeed(gunStats.projectile.speed)
          }
        />
        <StatBar
          label="Force"
          value={gunStats.projectile.force}
          max={50}
          modifier={hoverGunStats.projectile.force - gunStats.projectile.force}
        />
        <div className="mt-6">
          {gunStats.projectilePerShot.projectiles.length > 1 && (
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
                {gunStats.projectilePerShot.projectiles.map((p) => (
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
