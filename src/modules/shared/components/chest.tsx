import clsx from "clsx";
import type { TGun } from "@/client/generated/models/gun.model";

const chestImageLookup: Record<string, string> = {
  S: "/chest/black_chest.png",
  A: "/chest/red_chest.png",
  B: "/chest/green_chest.png",
  C: "/chest/blue_chest.png",
  D: "/chest/wood_chest.png",
  unknown: "/chest/unknown.png",
  None: "/chest/empty_chest.png",
};

type TChestProps = {
  className?: string;
  tier?: TGun["quality"] | "None";
  size?: "small";
};

export function Chest({ tier = "None", className, size, ...rest }: TChestProps) {
  const chestImageSrc = chestImageLookup[tier] || chestImageLookup.unknown;
  return (
    <div data-testid="chest-image-container" className={className} {...rest}>
      <img
        key={tier}
        src={chestImageSrc}
        className={clsx({
          "inline-block size-6 filter brightness-150": true,
          "size-4!": size === "small",
        })}
      />
    </div>
  );
}
