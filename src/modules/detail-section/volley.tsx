import { useState } from "react";
import clsx from "clsx";
import { Dice5 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Circle } from "./circle";
import { AnimatedSprite } from "../shared/components/animated-sprite";
import { Marker } from "@/components/icons/marker";
import { Chamber } from "@/components/icons/chamber";
import { primaryColor } from "../shared/settings/tailwind";
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
  const { id, volley, isSelected, onSelect, onHover, onBlur } = props;
  const [tooltipOpen, setTooltipOpen] = useState(false);

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
      {/* 64px is the height of the largest projectile (BSG gun), to prevent layout shift */}
      <div
        onMouseLeave={onBlur}
        className={clsx({
          "flex items-center gap-4 h-[64px] border border-transparent transition-colors duration-160": true,
          "border-primary!": tooltipOpen,
        })}
      >
        {volley.map((m, i) => {
          return (
            <Tooltip key={`${id}-${i}`} delayDuration={1000}>
              <TooltipTrigger>
                <div className="relative top-[2px] cursor-help">
                  {m.projectiles.length === 1 && m.projectiles[0].animation ? (
                    <div onClick={() => onSelect(i)} onMouseEnter={() => onHover(i)}>
                      <AnimatedSprite key={`${id}-${i}`} animation={m.projectiles[0].animation} />
                    </div>
                  ) : (
                    <Circle isSelected={isSelected(i)} onClick={() => onSelect(i)} onMouseEnter={() => onHover(i)} />
                  )}
                  {volley.length > 1 && isSelected(i) && (
                    <Marker className="absolute bottom-[-20px] left-1/2 transform -translate-x-1/2" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {m.projectiles.length === 1 && <div>{m.projectiles[0].id}</div>}
                {m.projectiles.length > 1 && (
                  <div>
                    Hover on one of the projectiles from the <strong>Projectile pool</strong> to inspect their stats
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
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
          "flex items-center gap-4 h-[64px] border border-transparent transition-colors duration-160": true,
          "border-primary!": tooltipOpen,
        })}
      >
        {projectiles.map((p, i) => (
          <Tooltip key={`${id}-${i}`} delayDuration={1000}>
            <TooltipTrigger className="relative top-[2px]">
              {p.animation ? (
                <div onClick={() => onSelect(i)} onMouseEnter={() => onHover(i)}>
                  <AnimatedSprite key={`${id}-${i}`} animation={p.animation} />
                </div>
              ) : (
                <Circle isSelected={isSelected(i)} onClick={() => onSelect(i)} onMouseEnter={() => onHover(i)} />
              )}
              {isSelected(i) && <Marker className="absolute bottom-[-20px] left-1/2 transform -translate-x-1/2" />}
            </TooltipTrigger>
            <TooltipContent>
              <p>{p.id}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
