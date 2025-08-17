import { useEffect, useState } from "react";
import clsx from "clsx";
import { AnimatedSprite } from "../shared/components/animated-sprite";
import { H2, H3 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Quality } from "./quality";
import { StatBar } from "./stat-bar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useHoverGun, useSelectedGun } from "../shared/hooks/useGuns";
import { useLoaderData } from "../shared/hooks/useLoaderData";
import { ProjectilePool, Volley } from "./volley";
import { GunService } from "@/client/service/gun.service";
import { ProjectileService } from "@/client/service/projectile.service";
import { useIsDebug } from "../shared/hooks/useDebug";
import { Features } from "./features";
import { StatStackBar } from "./stat-stack-bar";
import { ArrowLeftRight } from "lucide-react";
import { NumericValue } from "./numeric-value";
import { formatNumber } from "@/lib/lang";
import { AmmoSet } from "./ammo-set";
import { GunAttributes } from "./gun-attributes";
import { ColorItem } from "../top-bar/shared/components/color-item";
import { ShootStyle } from "./shoot-style";

export function DetailSection() {
  const gun = useSelectedGun();
  const hoverGun = useHoverGun();
  const debug = useIsDebug();
  const stats = useLoaderData((state) => state.stats);
  const [modeIndex, _setModeIndex] = useState(0);
  const [hoverProjectileIndex, setHoverProjectileIndex] = useState(-1);
  const [selectedProjectileIndex, _setSelectedProjectileIndex] = useState(-1);
  const [hoverProjectileDataIndex, setHoverProjectileDataIndex] = useState(-1);
  const [selectedProjectileDataIndex, _setSelectedProjectileDataIndex] = useState(-1);
  const setModeIndex = (index: number) => {
    _setModeIndex(index);
    // Reset projectile index when mode changes
    setHoverProjectileIndex(-1);
    _setSelectedProjectileIndex(-1);
    setHoverProjectileDataIndex(-1);
    _setSelectedProjectileDataIndex(-1);
  };
  const setSelectedProjectileIndex = (index: number) => {
    _setSelectedProjectileIndex(index === selectedProjectileIndex ? -1 : index);
  };
  const setSelectedProjectileDataIndex = (index: number) => {
    _setSelectedProjectileDataIndex(index === selectedProjectileDataIndex ? -1 : index);
  };
  const projectileIndex = hoverProjectileIndex !== -1 ? hoverProjectileIndex : selectedProjectileIndex;
  const projectileDataIndex = hoverProjectileDataIndex !== -1 ? hoverProjectileDataIndex : selectedProjectileDataIndex;

  const gunStats = GunService.computeGunStats(gun, modeIndex, projectileIndex, projectileDataIndex);
  const hoverGunStats = hoverGun
    ? GunService.computeGunStats(hoverGun, modeIndex, projectileIndex, projectileDataIndex)
    : gunStats;
  const selectedGun = hoverGun || gun;
  const selectedStats = hoverGunStats || gunStats;
  const showProjectilePool = selectedGun.projectileModes[0].projectiles[0].projectiles.length > 1;

  useEffect(() => {
    // Note: Don't remove this useEffect and use key={gun?.id} for parent component
    // The state is needed to apply transitions for stats when switching guns
    setModeIndex(0);

    // force showing projectile pool if it exists (there will be no volley)
    if (showProjectilePool) {
      _setSelectedProjectileIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gun.id]);

  return (
    <div className="p-2 pr-0 h-full flex flex-col min-h-0">
      <div>
        <div className="flex justify-center gap-1">
          {selectedGun.projectileModes.map(({ mode }, i, modes) => (
            <Button
              key={mode}
              size="sm"
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
          <AnimatedSprite key={gun.id} animation={gun.animation} scale={6} />
          {hoverGun && hoverGun.id !== gun.id && (
            <>
              <ArrowLeftRight className="fill-primary" />
              <AnimatedSprite key={hoverGun.id} animation={hoverGun.animation} scale={6} />
            </>
          )}
        </div>
        <blockquote className="flex justify-center w-full italic text-muted-foreground mb-4 font-sans font-semibold">
          {JSON.stringify(selectedGun.quote || "...")}
        </blockquote>
        <div className="bg-stone-900 px-2 py-2 rounded-tl-sm">
          <div className="flex justify-between items-baseline">
            <div className="flex gap-4 items-baseline">
              <H2>{selectedGun.name || "N/A"}</H2>
              <Quality tier={selectedGun.quality} className="relative top-[-6px]" />
            </div>
            <div>{debug && selectedGun.colors.map((c) => <ColorItem color={c} key={c} />)}</div>
            <div className="flex gap-2 items-center">
              <Tooltip>
                <TooltipTrigger>
                  <NumericValue>
                    {selectedStats.magazineSize}/{formatNumber(selectedStats.maxAmmo)}
                  </NumericValue>
                </TooltipTrigger>
                <TooltipContent>Magazine Size / Max Ammunition</TooltipContent>
              </Tooltip>
              <AmmoSet shootStyle={selectedStats.shootStyle} magazineSize={selectedStats.magazineSize} />
            </div>
          </div>
          <div className="flex justify-between items-baseline">
            <ShootStyle value={selectedStats.shootStyle} />
            <GunAttributes projectileData={selectedStats.projectile} gun={selectedGun} />
          </div>
        </div>
      </div>
      <div data-testid="detail-section-stats" className="overflow-y-auto flex-1 min-h-0 px-2 border-l border-stone-900">
        <StatStackBar
          label="DPS"
          max={100}
          segments={gunStats.dps.details}
          modifier={hoverGunStats.dps.base - gunStats.dps.base}
        />
        <StatBar
          label="Magazine Size"
          value={gunStats.magazineSize}
          max={Math.min(stats.maxMagazineSize, selectedGun.maxAmmo)}
          modifier={hoverGunStats.magazineSize - gunStats.magazineSize}
        />
        <StatBar
          label="Max Ammo"
          value={gunStats.maxAmmo}
          max={stats.maxMaxAmmo}
          modifier={hoverGunStats.maxAmmo - gunStats.maxAmmo}
          valueResolver={ProjectileService.getMaxAmmo}
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
        <div className="flex gap-2 items-center">
          <H3>Projectile Stats</H3>
          {!showProjectilePool && (
            <Volley
          id={`${selectedGun.id}-${modeIndex}`}
              projectiles={selectedStats.mode.projectiles}
          onSelect={setSelectedProjectileIndex}
          onHover={setHoverProjectileIndex}
          onBlur={() => setHoverProjectileIndex(-1)}
          isSelected={(i) => projectileIndex === i}
        />
          )}
          {showProjectilePool && (
            <ProjectilePool
              id={`${selectedGun.id}-${modeIndex}`}
              projectiles={selectedStats.projectilePerShot.projectiles}
              onBlur={() => setHoverProjectileDataIndex(-1)}
              onSelect={setSelectedProjectileDataIndex}
              onHover={setHoverProjectileDataIndex}
              isSelected={(i) => projectileDataIndex === i}
            />
          )}
        </div>
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
        <Features gun={selectedGun} className="mt-4" />
        {debug && (
          <pre className="text-left break-words whitespace-pre-wrap">{JSON.stringify(selectedGun, null, 2)}</pre>
        )}
        <div className="h-14" />
      </div>
    </div>
  );
}
