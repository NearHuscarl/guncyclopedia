import { Fragment, useState } from "react";
import clsx from "clsx";
import countBy from "lodash/countBy";
import { ChevronRight, Dice5 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Circle } from "./circle";
import { AnimatedSprite } from "../shared/components/animated-sprite";
import { Marker } from "@/components/icons/marker";
import { Chamber } from "@/components/icons/chamber";
import { primaryColor } from "../shared/settings/tailwind";
import { NumericValue } from "./numeric-value";
import type { TResolvedProjectile, TResolvedProjectileModule } from "@/client/service/game-object.service";
import { useGunStore } from "../shared/store/gun.store";

function ProjectileSprite({ projectile, isSelected }: { projectile: TResolvedProjectile; isSelected?: boolean }) {
  if (!projectile.animation) {
    return <Circle isSelected={isSelected} />;
  }
  return <AnimatedSprite key={projectile.id} animation={projectile.animation} />;
}
function ProjectileMarker({ isLast }: { isLast?: boolean }) {
  return (
    <Marker
      className={clsx({
        "absolute bottom-[-20px] left-1/2 transform -translate-x-1/2 -translate-y-[8px]": true,
        "-translate-x-[4px]": isLast,
      })}
    />
  );
}

type TProjectileListProps = {
  projectiles: TResolvedProjectile[];
  projectileIndex: number;
  onHover: (index: number) => void;
  onSelect: (index: number) => void;
};

function ProjectileList({ projectiles, projectileIndex, onHover, onSelect }: TProjectileListProps) {
  const shouldCollapse = projectiles.length > 11; // Particulator has 11 projectiles including the spawned ones, which barely fit the screen
  const pCount = shouldCollapse ? countBy(projectiles, (p) => p.id) : {};

  return (
    <>
      {projectiles.map((p, i) => {
        const spawnLevel = p.spawnLevel;
        const isTheFirstSpawnedProjectile = spawnLevel === (projectiles[i - 1]?.spawnLevel ?? 0) + 1;
        const isSelected = i === projectileIndex;
        return (
          <Fragment key={`${p.id}-${i}`}>
            {isTheFirstSpawnedProjectile && <ChevronRight className="" size={15} />}
            {isTheFirstSpawnedProjectile && shouldCollapse && (
              <NumericValue
                className="text-sm cursor-pointer"
                onMouseEnter={() => onHover(i)}
                onClick={() => onSelect(i)}
              >
                {pCount[p.id]}
              </NumericValue>
            )}
            {/* only render the first spawned projectile if in collapsed mode */}
            {(isTheFirstSpawnedProjectile || !shouldCollapse || !spawnLevel) && (
              <Tooltip delayDuration={1000}>
                <TooltipTrigger
                  // using p-2 instead of gap-4 to increase the clickable area
                  className="relative p-2 last:pr-0 cursor-help"
                  onMouseEnter={() => onHover(i)}
                  onClick={() => onSelect(i)}
                >
                  <ProjectileSprite projectile={p} isSelected={isSelected} />
                  {isSelected && <ProjectileMarker isLast={i === projectiles.length - 1} />}
                </TooltipTrigger>
                <TooltipContent>{p.id}</TooltipContent>
              </Tooltip>
            )}
          </Fragment>
        );
      })}
    </>
  );
}

type TVolleyProps = {
  volley: TResolvedProjectileModule[];
  finalProjectiles?: TResolvedProjectile[];
  projectileIndex: number;
  finalProjectileIndex: number;
  onSelect: (index: number) => void;
  onHover: (index: number) => void;
  onSelectFinal: (index: number) => void;
  onHoverFinal: (index: number) => void;
  onBlur: () => void;
};

export function Volley(props: TVolleyProps) {
  const {
    projectileIndex,
    finalProjectileIndex,
    onSelect,
    onHover,
    onSelectFinal,
    onHoverFinal,
    onBlur,
    volley,
    finalProjectiles = [],
  } = props;
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const hoverFinalProjectile = useGunStore((state) => state.hoverFinalProjectile);
  const projectiles = volley.map((m) => m.projectiles[0]);

  if (projectiles.length !== volley.length) {
    console.error("Unexpected error: Each module must have exactly one projectile. This volley is unhandled.", volley);
    return <div className="text-red-500">Error: projectile list</div>;
  }

  return (
    <div className="flex flex-1 items-center justify-between w-full">
      {volley.length > 1 && (
        <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
          <TooltipTrigger>
            <Chamber size={22} color={primaryColor} className="cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <strong>Volley</strong>
            <p>List of projectiles per shot fired</p>
          </TooltipContent>
        </Tooltip>
      )}
      <div />
      <div
        onMouseLeave={onBlur}
        className={clsx({
          "h-[64px]": true, // 64px is the height of the largest projectile (BSG gun), to prevent layout shift issue
          "flex items-center border border-transparent transition-colors duration-160": true,
          "border-primary!": tooltipOpen,
        })}
      >
        <ProjectileList
          projectiles={projectiles}
          projectileIndex={finalProjectileIndex === -1 ? projectileIndex : -1}
          onHover={onHover}
          onSelect={onSelect}
        />
        {finalProjectiles.length > 0 && (
          <div
            className={clsx({
              "flex items-center border border-transparent transition-colors duration-160": true,
              "border-primary!": hoverFinalProjectile,
            })}
          >
            …
            <ProjectileList
              projectiles={finalProjectiles}
              projectileIndex={finalProjectileIndex}
              onHover={onHoverFinal}
              onSelect={onSelectFinal}
            />
          </div>
        )}
      </div>
    </div>
  );
}

type TProjectilePoolProps = {
  projectiles: TResolvedProjectile[];
  isSelected: (index: number) => boolean;
  onSelect: (index: number) => void;
  onHover: (index: number) => void;
  onBlur: () => void;
};

export function ProjectilePool({ projectiles, isSelected, onSelect, onHover, onBlur }: TProjectilePoolProps) {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  return (
    <div className="flex flex-1 items-center justify-between w-full" onMouseLeave={onBlur}>
      <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
        <TooltipTrigger>
          <Dice5 size={22} color={primaryColor} className="cursor-help" />
        </TooltipTrigger>
        <TooltipContent>
          <strong>Random</strong>
          <p>List of projectiles to choose from when firing a single projectile</p>
          {/* TODO: random or sequential */}
        </TooltipContent>
      </Tooltip>
      <div
        className={clsx({
          "flex items-center h-[64px] border border-transparent transition-colors duration-160": true,
          "border-primary!": tooltipOpen,
        })}
      >
        {projectiles.map((p, i) => {
          const isLast = i === projectiles.length - 1;
          return (
            <Tooltip key={`${p.id}-${i}`} delayDuration={1000}>
              <TooltipTrigger
                className="relative p-2 last:pr-0"
                onMouseEnter={() => onHover(i)}
                onClick={() => onSelect(i)}
              >
                <ProjectileSprite projectile={p} isSelected={isSelected(i)} />
                {isSelected(i) && <ProjectileMarker isLast={isLast} />}
              </TooltipTrigger>
              <TooltipContent>
                <p>{p.id}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
