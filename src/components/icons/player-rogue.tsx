import type { IIconProps } from "./types";

export function PlayerRogue({ size = 20 }: IIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="11" height="11" />
      <path d="M2 4.5H4M7 4.5H9M1 8.5H2M2 9.5H3M8 9.5H9M9 8.5H10" stroke="#AD6600" />
      <path d="M2.5 5.5V6.5V8.5H3.5V9.5H7.5V8.5H8.5V6.5V5.5H2.5Z" fill="#FFBC7B" />
      <path d="M1 6.5H2.5M2.5 6.5V5.5H8.5V6.5M2.5 6.5V8.5H3.5V9.5H7.5V8.5H8.5V6.5M8.5 6.5H10" stroke="#FFBC7B" />
      <path d="M7.5 1V3.5M7.5 3.5H9M7.5 3.5H6.5V4.5H4M3 6.5H4M7 6.5H8M4 8.5H7" stroke="#530000" />
      <path d="M1 7.5H2M9 7.5H10M1.5 6V3.5H3.5V2.5H2M4 1.5H5M6 1.5H7M5.5 2V4M8.5 2V3M9.5 3V6" stroke="#AA0000" />
      <path d="M4.5 2V4M5.5 1V2M6.5 2V3" stroke="#FF2C2C" />
    </svg>
  );
}
