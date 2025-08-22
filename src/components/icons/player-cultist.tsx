import type { TIconProps } from "./types";

export function PlayerCultist({ size = 22 }: TIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="11" height="11" />
      <path d="M1.5 6V3M2.5 3V2M3 1.5H4.5H8M4 2.5H7M5 3.5H6M8.5 2V3M9.5 3V6" stroke="#3E3E3E" />
      <path d="M1.5 6V8.5H2.5V9.5H4M9.5 6V8.5H8.5V9.5H7" stroke="#151515" />
      <path d="M2.5 3.5H3.5H4.5V4.5H6.5V3.5H7.5H8.5V7.5H7.5V8.5H6.5V9.5H4.5V8.5H3.5V7.5H2.5V3.5Z" fill="#070707" />
      <path
        d="M3.5 2V3.5M3.5 3.5H2.5V7.5H3.5V8.5H4.5V9.5H6.5V8.5H7.5V7.5H8.5V3.5H7.5M3.5 3.5H4.5V4.5H6.5V3.5H7.5M7.5 3.5V2"
        stroke="#070707"
      />
      <path d="M3 6.5H4M7 6.5H8" stroke="#F3C800" />
    </svg>
  );
}
