import type { TIconProps } from "./types";

export function FightsabreAttack({ size = 20, color = "white" }: TIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" />
      <path
        d="M7 89.5C8.2 89.1 19.8333 82.3333 26 79.5L43 69L58.5 56L70 43L73.5 37.5V30.5L72.5 27L70 22.5L65 20L59.5 18.5H45L40.5 21L43 16.5L48 14.5L66 12.5H80L86 14.5L89.5 17L92.5 21L93.5 27V30.5L92.5 37.5L86 46L74.5 57.5L49.5 75L23.5 85.5L11.5 89.5L3 91.5L7 89.5Z"
        fill={color}
        stroke={color}
      />
    </svg>
  );
}
