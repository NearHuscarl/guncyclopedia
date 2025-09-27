import type { IIconProps } from "./types";

export function PlayerSlinger({ size = 20 }: IIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="11" height="11" />
      <path d="M3 4V6H4V7H3V8H5V7H6V8H8V7H7V6H8V4H9V9H8V10H3V9H2V4H3Z" fill="#1F2633" />
      <path d="M7 6V7H8V8H6V7H5V8H3V7H4V6H7Z" fill="#333C4E" />
      <path d="M8 5V6H3V5H8Z" fill="#9F9361" />
      <path d="M8 4V5H3V4H8Z" fill="#6E6750" />
      <path d="M6 3V4H1V3H6ZM7 1V2H2V1H7Z" fill="#793C1B" />
      <path d="M9 1V3H10V4H6V3H2V2H7V1H9Z" fill="#4D250C" />
    </svg>
  );
}
