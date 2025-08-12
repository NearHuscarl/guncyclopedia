import startCase from "lodash/startCase";
import { basicColors } from "@/client/generated/models/color.model";
import clsx from "clsx";

type TColorItemProps = {
  color: string;
  size?: "small";
};

export function ColorItem({ color, size }: TColorItemProps) {
  const backgroundColor = basicColors[color]?.[1] ?? basicColors[color]?.[0];

  return (
    <div
      className={clsx({
        "flex items-baseline gap-2": true,
        "gap-1!": size === "small",
      })}
    >
      <div
        title={color}
        className={clsx({
          "size-4 border border-stone-700 relative top-[2px]": true,
          "size-3! top-[1px]!": size === "small",
        })}
        style={{ backgroundColor, borderColor: backgroundColor }}
      />
      {startCase(color)}
    </div>
  );
}
