import type { TIconProps } from "./types";

export function PlayerCosmonaut({ size = 22 }: TIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="11" height="11" />
      <path d="M1.5 6V2.5H2.5V1.5H8.5V2.5H9.5V5M2 6.5H3M8 6.5H9M3 7.5H8" stroke="#ECEBD7" />
      <path d="M3 2.5H8M8.5 3V6M2.5 3V6M3 6.5H8" stroke="#EDC900" />
      <path d="M1.5 6V8.5H2.5M2.5 8.5V9.5H8.5V8.5M2.5 8.5H8.5M2.5 8.5V7M8.5 8.5H9.5V5M8.5 8.5V7" stroke="#8A8A8A" />
      <path d="M3 3.5H8M4 5.5H5M6 5.5H7" stroke="#24333D" />
      <path d="M3.5 6V4.5H5.5M7.5 6V4.5H5.5M5.5 4.5V6" stroke="#3C5768" />
    </svg>
  );
}
