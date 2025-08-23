import clsx from "clsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Chest } from "../shared/components/chest";
import type { TGun } from "@/client/generated/models/gun.model";

type TTierProps = {
  className?: string;
  tier: TGun["quality"];
};

export function Quality({ tier, className }: TTierProps) {
  const isKnownTier = ["S", "A", "B", "C", "D"].includes(tier);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Chest tier={tier} className={clsx("cursor-help", className)} />
      </TooltipTrigger>
      <TooltipContent>{isKnownTier ? `Tier ${tier}` : tier}</TooltipContent>
    </Tooltip>
  );
}
