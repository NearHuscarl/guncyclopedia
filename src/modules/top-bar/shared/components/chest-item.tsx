import clsx from "clsx";
import startCase from "lodash/startCase";
import { Chest } from "@/modules/shared/components/chest";
import type { TGun } from "@/client/generated/models/gun.model";

type TChestItemProps = {
  quality?: TGun["quality"] | "None";
  size?: "small";
};

export function ChestItem({ quality = "None", size }: TChestItemProps) {
  return (
    <div
      className={clsx({
        "flex gap-4 items-center": true,
        "gap-1!": size === "small",
      })}
    >
      <Chest tier={quality} size={size} /> {startCase(quality.toLowerCase())}
    </div>
  );
}
