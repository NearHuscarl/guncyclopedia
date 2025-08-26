import { StatStackBar } from "./stat-stack-bar";

type TStatBarProps = {
  label: string;
  labelTooltip?: string;
  value: number;
  valueResolver?: (value: number) => number;
  max: number;
  precision?: number;
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
 * @param {number} props.precision - Optional precision for formatting the value (default is 1 decimal place).
 * @param {number} props.max - The maximum possible value of the stat for calculating percentage width.
 * @param {boolean} props.isNegativeStat - Whether this stat is considered "bad" (e.g. reload time); affects color semantics.
 * @param {number} [props.modifier=0] - Optional modifier applied on top of the base stat; can be positive (buff) or negative (debuff).
 * @param {string} [props.unit] - Optional unit for the stat (e.g. "s" for seconds, "%" for percentage).
 *
 * @example
 * <StatBar label="Damage" value={8.2} max={15} modifier={+1.3} />
 * <StatBar label="Reload Time" value={2.1} max={5} isNegativeStat modifier={-0.4} />
 */
export function StatBar({
  label,
  labelTooltip,
  value,
  valueResolver,
  precision = 1,
  max,
  isNegativeStat,
  modifier = 0,
}: TStatBarProps) {
  return (
    <StatStackBar
      label={label}
      labelTooltip={labelTooltip}
      segments={[{ value }]}
      valueResolver={valueResolver}
      precision={precision}
      max={max}
      isNegativeStat={isNegativeStat}
      modifier={modifier}
    />
  );
}
