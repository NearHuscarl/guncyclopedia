import type { IIconProps } from "./types";

export function PlayerMarine({ size = 20 }: IIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="11" height="11" />
      <path d="M2 2V8H4V10H2V9H1V2H2ZM9 1V2H10V9H9V10H7V8H9V4H8V2H2V1H9Z" fill="#1A244E" />
      <path d="M8 2V4H2V2H8Z" fill="#49708A" />
      <path d="M9 4V8H7V7H8V5H3V7H4V8H2V4H9Z" fill="#020217" />
      <path d="M8 5V7H3V5H8Z" fill="#E04923" />
      <path d="M7 7V10H4V7H7Z" fill="#E2BB49" />
    </svg>
  );
}
