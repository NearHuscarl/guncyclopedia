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
import type { TProjectile } from "@/client/generated/models/projectile.model";
import type { TResolvedProjectileModule } from "@/client/service/game-object.service";

type TVolleyProps = {
  id: string;
  volley: TResolvedProjectileModule[];
  isSelected: (index: number) => boolean;
  onSelect: (index: number) => void;
  onHover: (index: number) => void;
  onBlur: () => void;
};

export function Volley(props: TVolleyProps) {
  const { id, isSelected, onSelect, onHover, onBlur, volley } = props;
  const [tooltipOpen, setTooltipOpen] = useState(false);
  // Particulator has 11 projectiles including the spawned ones, which barely fit the screen
  const shouldCollapse = volley.length > 11;
  const pCount = shouldCollapse ? countBy(volley, (m) => m.projectiles[0].id) : {};

  return (
    <div className="flex flex-1 items-center justify-between w-full">
      {volley.length > 1 ? (
        <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
          <TooltipTrigger>
            <Chamber size={22} color={primaryColor} className="relative top-[2px] cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <strong>Volley</strong>
            <p>List of projectiles per shot fired</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <div />
      )}
      <div
        onMouseLeave={onBlur}
        className={clsx({
          // 64px is the height of the largest projectile (BSG gun), to prevent layout shift issue
          "h-[64px]": true,
          "flex items-center border border-transparent transition-colors duration-160": true,
          "border-primary!": tooltipOpen,
        })}
      >
        {volley.map((m, i) => {
          const isLast = i === volley.length - 1;
          const spawnLevel = m.projectiles[0].spawnLevel;
          const isTheFirstSpawnedProjectile = spawnLevel === (volley[i - 1]?.projectiles[0].spawnLevel ?? 0) + 1;
          return (
            <Fragment key={`${id}-${i}`}>
              {isTheFirstSpawnedProjectile && <ChevronRight className="relative top-[2px]" size={15} />}
              {isTheFirstSpawnedProjectile && shouldCollapse && (
                <NumericValue
                  className="relative top-[2px] text-sm cursor-pointer"
                  onMouseEnter={() => onHover(i)}
                  onClick={() => onSelect(i)}
                >
                  {pCount[m.projectiles[0].id]}
                </NumericValue>
              )}
              {/* only render the first spawned projectile if in collapsed mode */}
              {(isTheFirstSpawnedProjectile || !shouldCollapse || !spawnLevel) && (
                <Tooltip delayDuration={1000}>
                  <TooltipTrigger
                    // using p-2 instead of gap-4 to increase the clickable area
                    className="relative top-[2px] p-2 last:pr-0 cursor-help"
                    onMouseEnter={() => onHover(i)}
                    onClick={() => onSelect(i)}
                  >
                    {m.projectiles[0].animation ? (
                      <AnimatedSprite key={`${id}-${i}`} animation={m.projectiles[0].animation} />
                    ) : (
                      <Circle isSelected={isSelected(i)} />
                    )}
                    {volley.length > 1 && isSelected(i) && (
                      <Marker
                        className={clsx({
                          "absolute bottom-[-20px] left-1/2 transform -translate-x-1/2 -translate-y-[8px]": true,
                          "-translate-x-[4px]": isLast,
                        })}
                      />
                    )}
                  </TooltipTrigger>
                  <TooltipContent>{m.projectiles.length === 1 && <div>{m.projectiles[0].id}</div>}</TooltipContent>
                </Tooltip>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

type TProjectilePoolProps = {
  id: string;
  projectiles: TProjectile[];
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
          <Dice5 size={22} color={primaryColor} className="relative top-[2px]" />
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
                className="relative top-[2px] p-2 last:pr-0"
                onMouseEnter={() => onHover(i)}
                onClick={() => onSelect(i)}
              >
                {p.animation ? (
                  <AnimatedSprite key={`${id}-${i}`} animation={p.animation} />
                ) : (
                  <Circle isSelected={isSelected(i)} />
                )}
                {isSelected(i) && (
                  <Marker
                    className={clsx({
                      "absolute bottom-[-20px] left-1/2 transform -translate-x-1/2 -translate-y-[8px]": true,
                      "-translate-x-[4px]": isLast,
                    })}
                  />
                )}
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
