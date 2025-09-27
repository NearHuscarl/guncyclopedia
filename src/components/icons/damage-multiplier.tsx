import type { IIconProps } from "./types";

export function DamageMultiplier({ size = 20, className, color }: IIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="24" height="24" />
      <path d="M3 8L7 4L11 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 4V14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 19V21H14V19H22ZM16 5V3H20V5H22V17H14V5H16ZM16 15H18V9H16V15Z" fill={color} />
    </svg>
  );
}
