import clsx from "clsx";
import sumBy from "lodash/sumBy";
import { Large } from "@/components/ui/typography";
import { formatNumber } from "@/lib/lang";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { usePrevious } from "@/lib/hooks";

type TSegment = {
  value: number; // part of the total
  source: string;
  /**
   * if true, the value is an estimate based on the best outcome
   */
  isEstimated?: boolean;
};

type TStatStackProps = {
  label: string;
  max: number;
  precision?: number;
  segments: TSegment[];
  isNegativeStat?: boolean;
};

/**
 * pad the segments array to at least 5 items for smoother transitions (e.g. prevent hard
 * jumps when number of segments changes)
 */
function padSegments<T extends { value: number }>(segments: T[], minLength: number): T[] {
  const padded = [...segments];
  while (padded.length < minLength) {
    padded.push({ value: 0 } as T);
  }
  return padded;
}

export function StatStackBar({ label, max, precision = 1, segments, isNegativeStat }: TStatStackProps) {
  const percentage = (v: number) => (Math.min(v, max) / max) * 100;
  const value =
    sumBy(
      segments.filter((s) => !s.isEstimated),
      "value",
    ) ?? 0;
  const bestValue = sumBy(segments, "value") ?? 0;
  const prevIsNegativeStat = usePrevious(isNegativeStat);
  const maxNumberOfSegments = 5;
  const gapInPx = 4; // gap between segments in pixels

  return (
    <div className="mb-2">
      <div className="flex justify-between mb-2">
        <p className="text-muted-foreground text-lg font-semibold">{label}</p>
        <Large>
          {bestValue - value > 0
            ? `${formatNumber(value, precision)} - ${formatNumber(bestValue, precision)}`
            : formatNumber(value, precision)}
        </Large>
      </div>

      <div className="relative flex h-2 bg-stone-800">
        {padSegments(segments, maxNumberOfSegments).map(({ value, source, isEstimated }, i) => {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const prevIsEstimated = usePrevious(isEstimated);
          const width = percentage(value);

          const needsSeparator = width > 0 && i > 0;
          const flexBasis = needsSeparator ? `calc(${width}% - ${gapInPx}px)` : `${width}%`;

          return (
            <Tooltip key={i} open={source === "" ? false : undefined}>
              <TooltipTrigger
                key={i}
                style={{ flexBasis, marginLeft: needsSeparator ? gapInPx : 0 }}
                className={clsx({
                  "bg-white transition-[flex-basis] duration-160 ease-out": true,
                  "bg-stone-600!":
                    (!isNegativeStat && isEstimated) ||
                    // ensure the transition color does not jump when going from having modifier to none
                    (value === 0 && !prevIsNegativeStat && prevIsEstimated),
                  "bg-red-600!": isNegativeStat,
                })}
              />
              <TooltipContent>
                <div dangerouslySetInnerHTML={{ __html: source }} />
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
