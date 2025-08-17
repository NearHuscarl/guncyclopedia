import { H3 } from "@/components/ui/typography";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Circle } from "./circle";
import { AnimatedSprite } from "../shared/components/animated-sprite";
import { Marker } from "@/components/icons/marker";
import type { TProjectile, TProjectilePerShot } from "@/client/generated/models/gun.model";

type TProjectilesPerShotProps = {
  id: string;
  projectiles: TProjectilePerShot[];
  isSelected: (index: number) => boolean;
  onSelect: (index: number) => void;
  onHover: (index: number) => void;
  onBlur: () => void;
};

export function ProjectilesPerShot(props: TProjectilesPerShotProps) {
  const { id, projectiles, isSelected, onSelect, onHover, onBlur } = props;

  return (
    <div className="flex gap-4 items-center">
      <Tooltip>
        <TooltipTrigger>
          <H3 className="border-b border-dashed border-stone-300/30 cursor-help">Projectiles per shot:</H3>
        </TooltipTrigger>
        <TooltipContent>
          <p>List of projectiles per shot fired</p>
        </TooltipContent>
      </Tooltip>
      {/* 64px is the height of the largest projectile (BSG gun), to prevent layout shift */}
      <div className="flex items-center h-[64px] " onMouseLeave={onBlur}>
        {projectiles.map((p, i) => {
          return (
            <Tooltip key={`${id}-${i}`} delayDuration={1000}>
              <TooltipTrigger>
                <div className="relative top-[2px] flex items-center">
                  {p.projectiles.length === 1 && p.projectiles[0].animation ? (
                    <div
                      className="min-w-4 flex justify-center px-1.5"
                      onClick={() => onSelect(i)}
                      onMouseEnter={() => onHover(i)}
                    >
                      <AnimatedSprite key={`${id}-${i}`} animation={p.projectiles[0].animation} />
                    </div>
                  ) : (
                    <Circle isSelected={isSelected(i)} onClick={() => onSelect(i)} onMouseEnter={() => onHover(i)} />
                  )}
                  {isSelected(i) && <Marker className="absolute bottom-[-20px] left-1/2 transform -translate-x-1/2" />}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {p.projectiles.length === 1 && <div>{p.projectiles[0].id}</div>}
                {p.projectiles.length > 1 && (
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
  return (
    <div className="flex gap-4 items-center" onMouseLeave={onBlur}>
      <Tooltip>
        <TooltipTrigger>
          <H3 className="border-b border-dashed border-stone-400/30 cursor-help">Projectile pool:</H3>
        </TooltipTrigger>
        <TooltipContent>
          {/* TODO: random or sequential */}
          <p>List of projectiles to choose from when firing a single projectile</p>
        </TooltipContent>
      </Tooltip>
      <div className="flex items-center h-[64px]">
        {projectiles.map((p, i) => (
          <Tooltip key={`${id}-${i}`} delayDuration={1000}>
            <TooltipTrigger className="relative top-[2px] flex items-center">
              {p.animation ? (
                <div
                  className="min-w-4 flex justify-center px-1.5"
                  onClick={() => onSelect(i)}
                  onMouseEnter={() => onHover(i)}
                >
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
