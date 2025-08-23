import type { IIconProps } from "./types";

export function PlayerEevee({ size = 22 }: IIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="11" height="11" />
      <path d="M6.5 7V8" stroke="#490977" />
      <path d="M1.5 1V4.5H4.5V2M1 9.5H2M7.5 10V7.5H10" stroke="#EF3D88" />
      <path d="M6 1.5H8.5V2.5M8.5 2.5H9.5V6M8.5 2.5V4" stroke="#1E4A2F" />
      <path d="M6 2.5H7.5V3.5H6" stroke="#4F854E" />
      <path d="M8 6.5H9" stroke="#152E25" />
      <path d="M9.5 6V7M9.5 8V9M9 9.5H8M7 9.5H6" stroke="#4D0754" />
      <path d="M6 4.5H8.5V6" stroke="#03150D" />
      <path d="M3 6.5H4" stroke="#11D731" />
      <path d="M6 6.5H8M6 8.5H7M8 8.5H9" stroke="#7F2088" />
      <path d="M6 5.5H8" stroke="#AF31D2" />
      <path d="M5 1.5H6" stroke="#A43BEF" />
      <path d="M1 5.5H2M5 1.5H4M5.5 2V4M2.5 3.5H3.5V2.5H2.5V3.5Z" stroke="#600C9D" />
      <path d="M2 5.5H6" stroke="#F585EC" />
      <path d="M1.5 6V7.5H2.5M2.5 7.5V8.5H3.5V9.5H6M2.5 7.5H5.5V6.5H4M2.5 7.5V6" stroke="#F153E4" />
      <path d="M5 4.5H6M4 8.5H6" stroke="#2F064D" />
    </svg>
  );
}
