import type { IIconProps } from "./types";

export function PlayerLamey({ size = 20 }: IIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="11" height="11" />
      <path d="M1.5 6V8M3 5.5H4.5V6.5H5.5V7.5M5.5 7.5H3.5V9.5H7.5V8M5.5 7.5H7" stroke="#FFA145" />
      <path d="M2 6.5H4M7 6.5H9" stroke="#530000" />
      <path d="M4 8.5H7" stroke="#C90000" />
      <path d="M3 4.5H4M5 5.5H6M6 6.5H7M7 7.5H8" stroke="#E15B00" />
      <path d="M7.5 1.5H4.5V4.5H6.5V5.5H8.5V3.5H7.5V1.5Z" fill="#1DF300" />
      <path d="M2.5 7V10M2.5 6V4M8.5 7V10M4.5 1.5H7.5V3.5H8.5V5.5H6.5V4.5H4.5V1.5Z" stroke="#1DF300" />
      <path d="M1.5 6V3.5H3.5V2.5M3.5 1V2.5M3.5 2.5H2M8 2.5H9M9.5 3V9" stroke="#18C800" />
    </svg>
  );
}
