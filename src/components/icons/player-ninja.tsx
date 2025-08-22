import type { TIconProps } from "./types";

export function PlayerNinja({ size = 22 }: TIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="11" height="11" />
      <path d="M1.5 5V2.5H2.5V1.5H4M7 1.5H8.5V2.5H9.5V5M1 8.5H2M2 9.5H3M8 9.5H9M9 8.5H10" stroke="#000436" />
      <path d="M1.5 5V7M5.5 5V7M9.5 5V7" stroke="#F10600" />
      <path d="M1 7.5H2M2 8.5H3M3 9.5H4M7 9.5H8M8 8.5H9M9 7.5H10" stroke="#00021D" />
      <path d="M5.5 4V5M4.5 5V7" stroke="#FF7572" />
      <path d="M6.5 5V7M5.5 7V8" stroke="#813A00" />
      <path
        d="M3.5 7.5V4.5H4.5V3.5H5.5V1.5H4.5V2.5H3.5V3.5H2.5V7.5H3.5ZM3.5 7.5H4.5V8.5M4.5 8.5H5.5V9.5H4M4.5 8.5H3"
        stroke="#FFE690"
      />
      <path
        d="M6.5 1V2.5M6.5 2.5H7.5V3.5H8.5V7.5H7.5M6.5 2.5V4.5H7.5V7.5M7.5 7.5V8.5H6.5M6.5 8.5V10M6.5 8.5V7"
        stroke="white"
      />
    </svg>
  );
}
