import type { TGun } from "@/client/generated/models/gun.model";
import clsx from "clsx";

type TTierProps = {
  tier: TGun["quality"];
};

export function Tier({ tier }: TTierProps) {
  const isKnownTier = ["S", "A", "B", "C", "D"].includes(tier);
  return (
    <span
      className={clsx({
        "font-bold text-xl": true,
        "text-gray-300": tier === "S",
        "text-red-500": tier === "A",
        "text-green-600": tier === "B",
        "text-sky-500": tier === "C",
        "text-amber-800": tier === "D",
        "text-stone-700": !isKnownTier,
      })}
    >
      {isKnownTier ? `Tier ${tier}` : tier}
    </span>
  );
}
