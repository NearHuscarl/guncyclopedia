import type { IIconProps } from "./types";

export function PlayerMarine({ size = 20 }: IIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="11" height="11" />
      <path d="M1.5 2V8.5H3.5V9.5H2M2 1.5H8.5V3.5H9.5M9.5 3.5V8.5H7.5V9.5H9M9.5 3.5V2" stroke="#1A244E" />
      <path d="M2 2.5H7.5V3.5H2" stroke="#49708A" />
      <path d="M4 7.5H2.5V4.5H8.5V7.5H7" stroke="#020217" />
      <path d="M7.5 5.5H3.5V6.5H7.5V5.5Z" stroke="#E04923" />
      <path d="M4.5 9.5V7.5H5.5H6.5V9.5H4.5Z" fill="#E2BB49" stroke="#E2BB49" />
    </svg>
  );
}
