import { H3 } from "@/components/ui/typography";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Circle } from "./circle";
import type { TProjectilePerShot } from "@/client/generated/models/gun.model";

type TProjectilesPerShotProps = {
  projectiles: TProjectilePerShot[];
  isSelected: (index: number) => boolean;
  onSelect: (index: number) => void;
  onHover: (index: number) => void;
  onBlur: () => void;
};

export function ProjectilesPerShot(props: TProjectilesPerShotProps) {
  const { projectiles, isSelected, onSelect, onHover, onBlur } = props;

  return (
    <div className="flex gap-4 items-baseline mt-6">
      <Tooltip>
        <TooltipTrigger>
          <H3 className="mb-4 border-b border-dashed border-stone-400/30 cursor-help">Projectiles per shot:</H3>
        </TooltipTrigger>
        <TooltipContent>
          <p>Each circle represents a projectile per shot</p>
        </TooltipContent>
      </Tooltip>
      <div className="flex gap-2 relative top-[3px]" onMouseLeave={onBlur}>
        {projectiles.map((p, i) => {
          return (
            <Tooltip key={i} delayDuration={800}>
              <TooltipTrigger>
                <Circle isSelected={isSelected(i)} onClick={() => onSelect(i)} onMouseEnter={() => onHover(i)} />
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
  );
}
