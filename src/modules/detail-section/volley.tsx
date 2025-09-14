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

function ProjectileSprite({ projectile, isSelected }: { projectile: TResolvedProjectile; isSelected?: boolean }) {
  return (
    <>
      {projectile.animation ? (
        <AnimatedSprite key={projectile.id} animation={projectile.animation} />
      ) : (
        <Circle isSelected={isSelected} />
      )}
    </>
  );
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

type TVolleyProps = {
  id: string;
  volley: TResolvedProjectileModule[];
  finalProjectiles?: TResolvedProjectile[];
  isSelected: (index: number) => boolean;
  isFinalSelected: (index: number) => boolean;
  onSelect: (index: number) => void;
  onHover: (index: number) => void;
  onSelectFinal: (index: number) => void;
  onHoverFinal: (index: number) => void;
  onBlur: () => void;
};

export function Volley(props: TVolleyProps) {
  const {
    id,
    isSelected,
    isFinalSelected,
    onSelect,
    onHover,
    onSelectFinal,
    onHoverFinal,
    onBlur,
    volley,
    finalProjectiles = [],
  } = props;
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const shouldCollapse = volley.length > 11; // Particulator has 11 projectiles including the spawned ones, which barely fit the screen
  const pCount = shouldCollapse ? countBy(volley, (m) => m.projectiles[0].id) : {};
  const projectiles = volley.map((m) => m.projectiles[0]);

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
        {projectiles.map((p, i) => {
          const spawnLevel = p.spawnLevel;
          const isTheFirstSpawnedProjectile = spawnLevel === (projectiles[i - 1]?.spawnLevel ?? 0) + 1;
          return (
            <Fragment key={`${id}-${i}`}>
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
                    <ProjectileSprite projectile={p} isSelected={isSelected(i)} />
                    {isSelected(i) && !isFinalSelected(i) && <ProjectileMarker isLast={i === projectiles.length - 1} />}
                  </TooltipTrigger>
                  <TooltipContent>{projectiles.length === volley.length && <div>{p.id}</div>}</TooltipContent>
                </Tooltip>
              )}
            </Fragment>
          );
        })}
        {finalProjectiles.length > 0 && <>…</>}
        {finalProjectiles.map((p, i) => (
          <Tooltip key={i} delayDuration={1000}>
            <TooltipTrigger
              // using p-2 instead of gap-4 to increase the clickable area
              className="relative p-2 last:pr-0 cursor-help"
              onMouseEnter={() => onHoverFinal(i)}
              onClick={() => onSelectFinal(i)}
            >
              <ProjectileSprite projectile={p} isSelected={isFinalSelected(i)} />
              {isFinalSelected(i) && <ProjectileMarker isLast={i === finalProjectiles.length - 1} />}
            </TooltipTrigger>
            <TooltipContent>{finalProjectiles.length === 1 && <div>{p.id}</div>}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}

type TProjectilePoolProps = {
  id: string;
  projectiles: TResolvedProjectile[];
  isSelected: (index: number) => boolean;
  onSelect: (index: number) => void;
  onHover: (index: number) => void;
  onBlur: () => void;
};

export function ProjectilePool({ id, projectiles, isSelected, onSelect, onHover, onBlur }: TProjectilePoolProps) {
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
            <Tooltip key={`${id}-${i}`} delayDuration={1000}>
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
