import type { IIconProps } from "./types";

export function PlayerSlinger({ size = 20 }: IIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="11" height="11" />
      <path
        d="M2.5 4V6.5M3.5 8.5H2.5V6.5M3.5 8.5V9.5H7.5V8.5M3.5 8.5H5.5M7.5 8.5H8.5V6.5M7.5 8.5H5.5M8.5 4V6.5M5.5 8.5V7M2.5 6.5H4M7 6.5H8.5"
        stroke="#1F2633"
      />
      <path d="M3 7.5H4.5V6.5H6.5V7.5H8" stroke="#333C4E" />
      <path d="M3 5.5H8" stroke="#9F9361" />
      <path d="M3 4.5H8" stroke="#6E6750" />
      <path d="M1 3.5H6M2 1.5H7" stroke="#793C1B" />
      <path d="M2 2.5H6.5V3.5H8.5M8.5 3.5V1.5H7.5V3M8.5 3.5H10" stroke="#4D250C" />
    </svg>
  );
}
