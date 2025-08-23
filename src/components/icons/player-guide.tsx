import type { IIconProps } from "./types";

export function PlayerGuide({ size = 22 }: IIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="11" height="11" />
      <path d="M1.5 6V9M2 9.5H9M9.5 6V9" stroke="#5B1E00" />
      <path
        d="M2 6.5H3M8 6.5H9M1.5 6V3.5H2.5M2.5 3.5V2.5H3.5V4M2.5 3.5V5M9.5 6V3.5H8.5M8.5 3.5V2.5H7.5V4M8.5 3.5V5"
        stroke="#151330"
      />
      <path d="M5.5 1.5H6.5V3.5H5.5M5.5 1.5H4.5V3.5H5.5M5.5 1.5V3.5" stroke="#352048" />
      <path d="M2 5.5H3.5V4.5H7.5V5.5M7.5 5.5H9M7.5 5.5V7.5H8.5V8.5H2.5V7.5H3.5V6.5H6.5V5.5H4" stroke="#913F17" />
      <path d="M4 7.5H7" stroke="#810000" />
    </svg>
  );
}
