import clsx from "clsx";
import { Large } from "@/components/ui/typography";

type TStatBarProps = {
  label: string;
  value: number;
  max: number;
  negativeStat?: boolean;
};

export function StatBar({ label, value, max, negativeStat }: TStatBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="mb-2">
      <div className="flex justify-between mb-2">
        <p className="text-muted-foreground text-lg font-semibold">{label}</p>
        <Large>{value}</Large>
      </div>
      <div className="relative flex-1 h-2 bg-stone-700 overflow-hidden">
        <div
          className={clsx({
            "absolute h-full transition-[width] duration-160 ease-out": true,
            "bg-red-500": negativeStat,
            "bg-white": !negativeStat,
          })}
          style={{ width: `${percentage}%` }}
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 text-xs text-black font-semibold" />
      </div>
    </div>
  );
}
