import type { TIconProps } from "./types";

export function DamageMultiplier({ size = 20, className }: TIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M3 8L7 4L11 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 4V14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 4H20M21 5V17M15 5V16M15 17V16M17 5V9M19 5V16M19 17V16M15 16H19M14 20H22" strokeWidth="2" />
    </svg>
  );
}
