import { type CSSProperties } from "react";
import clsx from "clsx";
import { Large } from "@/components/ui/typography";
import { usePrevious } from "@/lib/hooks";
import { formatNumber } from "@/lib/lang";

type TStatBarProps = {
  label: string;
  value: number;
  max: number;
  isNegativeStat?: boolean;
  modifier?: number;
  unit?: string;
};

/**
 * Displays a horizontal stat bar with a base value and an optional modifier (buff/debuff).
 * Visually represents the base stat and overlays a modifier bar in green or orange
 * depending on whether it's a positive or negative modifier.
 *
 * @component
 *
 * @param {Object} props - Component props
 * @param {string} props.label - The name of the stat to display (e.g. "Damage", "Speed").
 * @param {number} props.value - The base value of the stat (before modifiers).
 * @param {number} props.max - The maximum possible value of the stat for calculating percentage width.
 * @param {boolean} props.isNegativeStat - Whether this stat is considered "bad" (e.g. reload time); affects color semantics.
 * @param {number} [props.modifier=0] - Optional modifier applied on top of the base stat; can be positive (buff) or negative (debuff).
 * @param {string} [props.unit] - Optional unit for the stat (e.g. "s" for seconds, "%" for percentage).
 *
 * @example
 * <StatBar label="Damage" value={8.2} max={15} modifier={+1.3} />
 * <StatBar label="Reload Time" value={2.1} max={5} isNegativeStat modifier={-0.4} />
 */
export function StatBar({ label, value, max, isNegativeStat, modifier = 0 }: TStatBarProps) {
  const basePercentage = Math.min((value / max) * 100, 100);
  const modPercentage = (modifier / Math.max(value, max)) * 100;
  const isPositiveModifier = (modifier >= 0 && !isNegativeStat) || (modifier < 0 && isNegativeStat);
  const prevModPercentage = usePrevious(modPercentage);
  const modifierStyle: CSSProperties = {};

  // Ensure the width's transition does not jump after going from negative to no modifier
  const modPercentageSign = Math.sign(modPercentage || prevModPercentage || 1);
  if (modPercentageSign === 1) {
    modifierStyle.left = `${basePercentage}%`;
    modifierStyle.width = `${modPercentage}%`;
  } else if (modPercentageSign === -1) {
    modifierStyle.right = `${100 - basePercentage}%`;
    modifierStyle.width = `${-modPercentage}%`;
  }

  return (
    <div className="mb-2">
      <div className="flex justify-between mb-2">
        <p className="text-muted-foreground text-lg font-semibold">{label}</p>
        <Large>
          {formatNumber(value + modifier, 1)}
          {/* {unit} */}
        </Large>
      </div>
      <div className="relative flex-1 h-2 bg-stone-800">
        <div
          style={{ width: `${basePercentage}%` }}
          className={clsx({
            "absolute h-full transition-[width] duration-160 ease-out": true,
            "bg-red-500": isNegativeStat,
            "bg-white": !isNegativeStat,
          })}
        />
        <div
          className={clsx({
            "absolute h-full transition-[width] duration-160 ease-out": true,
            "bg-green-500": isPositiveModifier,
            "bg-orange-500": !isPositiveModifier,
          })}
          style={modifierStyle}
        />
      </div>
    </div>
  );
}
