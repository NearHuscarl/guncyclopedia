import type { TIconProps } from "./types";

export function Marker({ size = 15, color = "white", className }: TIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="12" height="12" />
      <path d="M11 9L6 3L1 9" fill={color} />
    </svg>
  );
}
