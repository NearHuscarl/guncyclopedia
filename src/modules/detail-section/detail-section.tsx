import { useEffect, useState } from "react";
import isUndefined from "lodash/isUndefined";
import clsx from "clsx";
import { H2, H3 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { AnimatedSprite } from "../shared/components/animated-sprite";
import { AnimatedSpriteSeries } from "../shared/components/animated-sprite-series";
import { Quality } from "./quality";
import { StatBar } from "./stat-bar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useHoverGun, useSelectedGun } from "../shared/hooks/useGuns";
import { useLoaderData } from "../shared/hooks/useLoaderData";
import { ProjectilePool, Volley } from "./volley";
import { GunService } from "@/client/service/gun.service";
import { ProjectileService } from "@/client/service/projectile.service";
import { Features } from "./features";
import { StatStackBar } from "./stat-stack-bar";
import { ArrowLeftRight } from "lucide-react";
import { NumericValue } from "./numeric-value";
import { formatNumber } from "@/lib/lang";
import { AmmoSet } from "./ammo-set";
import { GunAttributes } from "./gun-attributes";
import { ShootStyle } from "./shoot-style";
import { useGunStore } from "../shared/store/gun.store";
import { DebugData } from "./debug-data";
import { useIsDebug } from "../shared/hooks/useDebug";
import type { TGun } from "@/client/generated/models/gun.model";

// Attributes
// Long Range | Mid Range | Close Range: range
// High Firerate | Steady Firerate: ROF
// Hard Hitting: High Projectile Damage
// Aggressive: High ROF, Low Precision
// Accurate: At least Steady ROF, High Precision
// Unpredictable: Large damage range

// Sometimes the reload animation is cooler than the intro one.
const forceUseReloadAsIntroAnimation = new Set([387]);

function MainGunSprite({ gun, hoverGun, mode }: { gun: TGun; hoverGun?: TGun; mode: string }) {
  const useChargeAnimation = useGunStore((state) => state.useChargeAnimation);
  let animationName: keyof TGun["animation"] = "idle";
  const chargeAnimation = gun.animation.charge ?? gun.animation.idle; // gamma ray doesn't have charge & shooting anim

  if (useChargeAnimation) animationName = "charge";

  return (
    <div className="flex items-center justify-center h-36 gap-10">
      {gun.attribute.trickGun ? (
        <AnimatedSpriteSeries
          key={`${gun.id}-${mode}`}
          scale={6}
          animations={(mode === "Alternate"
            ? [gun.animation.reload, gun.animation.alternateIdle]
            : [gun.animation.alternateReload, gun.animation.idle]
          ).filter((a) => !isUndefined(a))}
        />
      ) : !useChargeAnimation ? (
        <AnimatedSpriteSeries
          key={`${gun.id}-${animationName}`}
          scale={6}
          // TODO: moonscraper charge animation doesn't exist
          animations={[
            gun.animation.intro && !forceUseReloadAsIntroAnimation.has(gun.id)
              ? gun.animation.intro
              : gun.animation.reload,
            gun.animation.idle,
          ].filter((a) => !isUndefined(a))}
        />
      ) : (
        <AnimatedSprite key={`${gun.id}-${animationName}`} scale={6} animation={chargeAnimation} />
      )}
      {hoverGun && hoverGun.id !== gun.id && (
        <>
          <ArrowLeftRight className="fill-primary" />
          <AnimatedSprite key={hoverGun.id} animation={hoverGun.animation.idle} scale={6} />
        </>
      )}
    </div>
  );
}

export function DetailSection() {
  const isDebug = useIsDebug();
  const gun = useSelectedGun();
  const hoverGun = useHoverGun();
  const stats = useLoaderData((state) => state.stats);
  const [modeIndex, _setModeIndex] = useState(0);
  const [hoverModuleIndex, setHoverModuleIndex] = useState(-1);
  const [selectedModuleIndex, _setSelectedModuleIndex] = useState(-1);
  const [hoverProjectileIndex, setHoverProjectileIndex] = useState(-1);
  const [selectedProjectileIndex, _setSelectedProjectileIndex] = useState(-1);
  const setModeIndex = (index: number) => {
    _setModeIndex(index);
    // Reset projectile index when mode changes
    setHoverModuleIndex(-1);
    _setSelectedModuleIndex(-1);
    setHoverProjectileIndex(-1);
    _setSelectedProjectileIndex(-1);
  };
  const setSelectedModuleIndex = (index: number) => {
    _setSelectedModuleIndex(index === selectedModuleIndex ? -1 : index);
  };
  const setSelectedProjectileIndex = (index: number) => {
    _setSelectedProjectileIndex(index === selectedProjectileIndex ? -1 : index);
  };
  const moduleIndex = hoverModuleIndex !== -1 ? hoverModuleIndex : selectedModuleIndex;
  const projectileIndex = hoverProjectileIndex !== -1 ? hoverProjectileIndex : selectedProjectileIndex;

  const gunStats = GunService.computeGunStats(gun, modeIndex, moduleIndex, projectileIndex);
  const hoverGunStats = hoverGun
    ? GunService.computeGunStats(hoverGun, modeIndex, moduleIndex, projectileIndex)
    : gunStats;
  const selectedGun = hoverGun || gun;
  const selectedStats = hoverGunStats || gunStats;
  const showProjectilePool = selectedGun.projectileModes[0].volley[0].projectiles.length > 1;
  const isCustomMagazineSize = selectedStats.projectileModule.ammoCost > 1;

  useEffect(() => {
    // Note: Don't remove this useEffect and use key={gun?.id} for parent component
    // The state is needed to apply transitions for stats when switching guns

    setModeIndex(0);
    if (gun.projectileModes.length > 1 && gun.projectileModes.at(-1)?.mode.startsWith("Charge")) {
      // prioritize to show the max charge of the weapon where it might contain the unique features
      _setModeIndex(gun.projectileModes.length - 1);
    }

    // force showing projectile pool if it exists (there will be no volley)
    if (showProjectilePool) {
      _setSelectedModuleIndex(0);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gun.id]);

  return (
    <div className="p-2 pr-0 h-full flex flex-col min-h-0">
      <div>
        <div key={gun.id} className="flex justify-center gap-1">
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
        <MainGunSprite gun={gun} hoverGun={hoverGun} mode={gunStats.mode.mode} />
        <blockquote className="flex justify-center w-full italic text-muted-foreground mb-4 font-sans font-semibold">
          {JSON.stringify(selectedGun.quote || "...")}
        </blockquote>
        <div className="bg-stone-900 px-2 py-2 rounded-tl-sm">
          <div className="flex justify-between items-baseline">
            <div className="flex gap-4 items-baseline">
              <H2>{selectedGun.name || "N/A"}</H2>
              <Quality tier={selectedGun.quality} className="relative top-[-6px]" />
            </div>
            <div className="flex gap-2 items-center">
              <Tooltip>
                <TooltipTrigger>
                  <NumericValue className="cursor-help">
                    {selectedStats.magazineSize}/{formatNumber(ProjectileService.getMaxAmmo(selectedStats.maxAmmo))}
                  </NumericValue>
                </TooltipTrigger>
                <TooltipContent>Magazine Size / Max Ammo</TooltipContent>
              </Tooltip>
              <AmmoSet shootStyle={selectedStats.shootStyle} magazineSize={selectedStats.magazineSize} />
            </div>
          </div>
          <div className="flex justify-between items-baseline">
            <ShootStyle value={selectedStats.shootStyle} />
            <GunAttributes projectile={selectedStats.projectile} gun={selectedGun} gunStats={selectedStats} />
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
          label={"Magazine Size" + (isCustomMagazineSize ? "*" : "")}
          labelTooltip={
            isCustomMagazineSize
              ? `The base magazine size is <strong>${selectedGun.projectileModes[0].magazineSize}</strong>, but since each shot consumes <strong>${selectedStats.projectileModule.ammoCost}</strong> ammo, its effective capacity is <strong>${selectedStats.magazineSize}</strong>`
              : undefined
          }
          labelTooltipClassName="text-wrap w-72"
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
        <div className="flex gap-2 items-center">
          <H3>Projectile Stats</H3>
          {!showProjectilePool && (
            <Volley
              id={`${selectedGun.id}-${modeIndex}`}
              volley={selectedStats.mode.volley}
              onSelect={setSelectedModuleIndex}
              onHover={setHoverModuleIndex}
              onBlur={() => setHoverModuleIndex(-1)}
              isSelected={(i) => moduleIndex === i}
            />
          )}
          {showProjectilePool && (
            <ProjectilePool
              id={`${selectedGun.id}-${modeIndex}`}
              projectiles={selectedStats.projectileModule.projectiles}
              onBlur={() => setHoverProjectileIndex(-1)}
              onSelect={setSelectedProjectileIndex}
              onHover={setHoverProjectileIndex}
              isSelected={(i) => projectileIndex === i}
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
          labelTooltipClassName="w-80 text-wrap"
          max={1000}
          precision={0}
          valueResolver={ProjectileService.getFireRate}
          value={gunStats.fireRate}
          modifier={hoverGunStats.fireRate - gunStats.fireRate}
        />
        <StatBar
          label="Precision"
          labelTooltip={`Spread: <strong>${gunStats.projectileModule.spread}°</strong><br/>Higher precision results in less bullet spread. Scales the spread range [30deg (worst) .. 0 (best)] into a precision percentage [0 (worst) .. 100 (best)]`}
          labelTooltipClassName="w-80 text-wrap"
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
          value={gunStats.projectile.speed}
          max={100}
          valueResolver={ProjectileService.getSpeed}
          modifier={hoverGunStats.projectile.speed - gunStats.projectile.speed}
        />
        <StatStackBar
          label="Force"
          max={50}
          segments={gunStats.force.details}
          modifier={hoverGunStats.force.base - gunStats.force.base}
        />
        <Features gun={selectedGun} className="mt-4" />
        {isDebug && <DebugData gun={selectedGun} stats={selectedStats} />}
        <div className="h-14" />
      </div>
    </div>
  );
}
