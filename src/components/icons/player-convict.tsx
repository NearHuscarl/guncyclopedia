import type { IIconProps } from "./types";

export function PlayerConvict({ size = 22 }: IIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="11" height="11" />
      <path d="M7.5 8V9.5H3.5V8.5H2.5V7.5H1.5V6.5H2.5V5.5H4.5V6.5H5.5V7.5M5.5 7.5H3M5.5 7.5H7" stroke="#FFA145" />
      <path d="M4 8.5H7" stroke="#530000" />
      <path d="M3 6.5H4" stroke="#0063E9" />
      <path d="M2 4.5H4M5 5.5H6M6 6.5H7M7 7.5H8M8 8.5H9" stroke="#E15B00" />
      <path
        d="M1.5 6V3.5H2.5M2.5 3.5V2.5H3.5V1.5H7.5V2.5M2.5 3.5H4.5M7.5 2.5H8.5V3.5M7.5 2.5H4.5V3.5M8.5 3.5H9.5V9M8.5 3.5V8M6 5.5H7.5V7M4.5 3.5H5.5V4.5H4"
        stroke="#F3C800"
      />
      <path d="M6.5 4.5V3.5H7.5V4.5H6.5Z" stroke="white" />
    </svg>
  );
}
