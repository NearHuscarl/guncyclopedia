import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { TGun } from "@/client/generated/models/gun.model";

type TTierProps = {
  className?: string;
  tier: TGun["quality"];
};

const chestImageLookup: Record<string, string> = {
  S: "/chest/black_chest.png",
  A: "/chest/red_chest.png",
  B: "/chest/green_chest.png",
  C: "/chest/blue_chest.png",
  D: "/chest/wood_chest.png",
  unknown: "/chest/unknown.png",
};

export function Tier({ tier, className }: TTierProps) {
  const isKnownTier = ["S", "A", "B", "C", "D"].includes(tier);
  const chestImageSrc = chestImageLookup[tier] || chestImageLookup.unknown;
  return (
    <Tooltip>
      <TooltipTrigger className={className}>
        <img key={tier} src={chestImageSrc} className={"inline-block w-6 h-6"} />
      </TooltipTrigger>
      <TooltipContent>{isKnownTier ? `Tier ${tier}` : tier}</TooltipContent>
    </Tooltip>
  );
}
