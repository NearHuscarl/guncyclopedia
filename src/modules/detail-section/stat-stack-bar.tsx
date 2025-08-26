import clsx from "clsx";
import clamp from "lodash/clamp";
import { formatNumber } from "@/lib/lang";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { usePrevious } from "@/lib/hooks";
import { useSelectedGun } from "../shared/hooks/useGuns";
import { NumericValue } from "./numeric-value";
import { useAppState } from "../shared/hooks/useAppState";
import type { HTMLAttributes, ReactNode } from "react";

function isInfinite(value: number): boolean {
  return value >= 10_000;
}

function createModifierComponent({
  modifier,
  value,
  max,
  gunId,
  isNegativeStat,
}: {
  modifier: number;
  value: number;
  max: number;
  gunId: number;
  isNegativeStat?: boolean;
}) {
  let basePercentage = (value / max) * 100;
  basePercentage = clamp(basePercentage, 0, 100);

  let modifier2 = modifier;
  if (value > max) {
    // clamp modifier2 to make sure the ratio to max is respected.
    // Select 'Shotgrub' > Select 'Chromesteel..' in comparision mode. Force
    const overflowedBy = Math.abs(value - max);
    modifier2 = Math.sign(modifier2) * (Math.abs(modifier2) - overflowedBy);
  }

  let modPercentage = (modifier2 / max) * 100;
  const maxPositiveModifier = 100 - basePercentage;
  const maxNegativeModifier = basePercentage;

  modPercentage = clamp(modPercentage, -maxNegativeModifier, maxPositiveModifier);

  const posScale = maxPositiveModifier > 0 && modPercentage > 0 ? modPercentage / maxPositiveModifier : 0;
  const negScale = maxNegativeModifier > 0 && modPercentage < 0 ? -modPercentage / maxNegativeModifier : 0;

  const posColor = isNegativeStat ? "bg-orange-500" : "bg-green-500";
  const negColor = isNegativeStat ? "bg-green-500" : "bg-orange-500";

  // (2)(3): When user changes guns, the stat width is updated, which moves the mount position of the modifier portion violently.
  // Solution: Remove the modifier immediately.
  return {
    positiveModifier: (
      <div
        key={`modifier-positive-${gunId}`} // (2)
        data-testid={`modifier-positive-${gunId}`}
        className="absolute h-full pointer-events-none"
        style={{ left: `${basePercentage}%`, width: `${maxPositiveModifier}%` }}
      >
        <div
          style={{ transform: `scaleX(${posScale})` }}
          className={clsx(
            "h-full origin-left transition-transform duration-160 ease-out will-change-transform",
            posColor,
          )}
        />
      </div>
    ),
    negativeModifier: (
      <div
        key={`modifier-negative-${gunId}`} // (3)
        data-testid={`modifier-negative-${gunId}`}
        className="absolute h-full pointer-events-none"
        style={{ right: `${100 - basePercentage}%`, width: `${maxNegativeModifier}%` }}
      >
        <div
          style={{ transform: `scaleX(${negScale})` }}
          className={clsx(
            "h-full origin-right transition-transform duration-160 ease-out will-change-transform",
            negColor,
          )}
        />
      </div>
    ),
  };
}

interface ISegment {
  value: number; // part of the total
  tooltip?: string;
  /**
   * if true, the value is an estimate based on the best outcome
   */
  isEstimated?: boolean;
  color?: string;
}

type TStatStackProps = {
  label: ReactNode;
  labelTooltip?: string;
  max: number;
  precision?: number;
  segments: ISegment[];
  modifier?: number;
  valueResolver?: (value: number) => number;
  isNegativeStat?: boolean;
};

interface IPreparedSegment extends ISegment {
  cappedValue: number;
}

function prepareSegment(segments: ISegment[], max: number) {
  let baseValue = 0;
  let totalValue = 0;
  const paddedSegments: IPreparedSegment[] = [];

  for (const segment of segments) {
    if (!segment.isEstimated) {
      baseValue += segment.value;
    }

    const segmentCap = Math.max(max - totalValue, 0);
    // Ensure each segment value does not exceed the max value
    paddedSegments.push({ ...segment, value: segment.value, cappedValue: Math.min(segment.value, segmentCap) });
    totalValue += segment.value;
  }

  // pad the segments array to at least 5 items for smoother transitions (e.g. prevent hard
  // jumps when the number of segments changes)
  const maxNumberOfSegments = 5;
  while (paddedSegments.length < maxNumberOfSegments) {
    paddedSegments.push({ value: 0, cappedValue: 0 });
  }

  return {
    paddedSegments,
    baseValue,
    totalValue,
  };
}

export function StatStackBar({
  label,
  labelTooltip,
  max,
  precision = 1,
  segments,
  isNegativeStat,
  valueResolver,
  modifier = 0,
}: TStatStackProps) {
  const gun = useSelectedGun();
  const isComparisonMode = useAppState((state) => state.isComparisonMode);
  const percentage = (v: number) => (Math.min(v, max) / max) * 100;
  const { paddedSegments, baseValue, totalValue } = prepareSegment(segments, max);
  const { negativeModifier, positiveModifier } = createModifierComponent({
    gunId: gun.id,
    max,
    value: baseValue,
    modifier,
    isNegativeStat,
  });

  const gapInPx = 4; // gap between segments in pixels
  const labelElement = <p className="text-muted-foreground font-semibold uppercase">{label}</p>;

  const displayBaseValue = valueResolver?.(baseValue + modifier) ?? baseValue + modifier;
  const displayTotalValue = valueResolver?.(totalValue) ?? totalValue;

  return (
    <div className="mb-2">
      <div className="flex justify-between mb-2 items-baseline">
        {labelTooltip ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">{labelElement}</div>
            </TooltipTrigger>
            <TooltipContent className="w-80 text-wrap">
              <div dangerouslySetInnerHTML={{ __html: labelTooltip }} />
            </TooltipContent>
          </Tooltip>
        ) : (
          labelElement
        )}
        <NumericValue>
          {totalValue - baseValue > 0 && !isInfinite(totalValue - baseValue) && !modifier
            ? `${formatNumber(displayBaseValue, precision)} - ${formatNumber(displayTotalValue, precision)}`
            : formatNumber(displayBaseValue, precision)}
        </NumericValue>
      </div>

      <div className="relative flex h-2 bg-stone-800">
        {paddedSegments.map(({ value, cappedValue, tooltip = "", isEstimated, color }, i) => {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const prevIsEstimated = usePrevious(isEstimated);
          const width = percentage(cappedValue);

          const needsSeparator = width > 0 && i > 0;
          const flexBasis = needsSeparator ? `calc(${width}% - ${gapInPx}px)` : `${width}%`;

          // ensure the transition color does not jump when going from having modifier to none
          const isUsedToBeEstimated = value === 0 && prevIsEstimated;
          const isEstimatedValue = (!isNegativeStat && isEstimated) || isUsedToBeEstimated;
          const isInfiniteValue = isInfinite(value);

          const barProps: HTMLAttributes<HTMLElement> = {
            style: { flexBasis, marginLeft: needsSeparator ? gapInPx : 0, backgroundColor: color },
            className: clsx({
              "bg-white transition-all duration-160 ease-out hover:bg-primary!": true,
              "bg-stone-600!": isEstimatedValue && !isInfiniteValue,
              "bg-purple-500/30!": isEstimatedValue && isInfiniteValue,
              "bg-red-600!": isNegativeStat,
            }),
          };

          // Because of the solution for (2)(3), when the modifier is removed instantly, the stat
          // width grows/shrinks to 'catch up' with the modifier, resulting in an annoying glitch
          const key = isComparisonMode && i === 0 ? gun.id : i;

          return (
            <Tooltip
              key={key}
              // NOTE: don't render a div element conditionally to reuse the same component instance for the transition effect.
              delayDuration={tooltip ? 100 : 100_000}
            >
              <TooltipTrigger {...barProps} />
              <TooltipContent>
                <div
                  dangerouslySetInnerHTML={{
                    __html: tooltip.replace("{{VALUE}}", formatNumber(isInfiniteValue ? Infinity : value, precision)),
                  }}
                />
              </TooltipContent>
            </Tooltip>
          );
        })}
        {/* Note that the modifiers are separate from the segments. I want the transition to anchor the end of the bar to visually represent the difference. */}
        {positiveModifier}
        {negativeModifier}
      </div>
    </div>
  );
}
