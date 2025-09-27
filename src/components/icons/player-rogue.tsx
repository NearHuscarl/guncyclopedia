import type { IIconProps } from "./types";

export function PlayerRogue({ size = 20 }: IIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="11" height="11" />
      <path d="M3 9V10H2V9H3ZM9 9V10H8V9H9ZM2 8V9H1V8H2ZM10 8V9H9V8H10ZM4 4V5H2V4H4ZM9 4V5H7V4H9Z" fill="#AD6600" />
      <path d="M9 5V6H10V7H9V9H8V10H3V9H2V7H1V6H2V5H9ZM4 8V9H7V8H4ZM7 6V7H8V6H7ZM3 7H4V6H3V7Z" fill="#FFBC7B" />
      <path d="M7 8V9H4V8H7ZM4 6V7H3V6H4ZM8 6V7H7V6H8ZM8 1V3H9V4H7V5H4V4H6V3H7V1H8Z" fill="#530000" />
      <path
        d="M2 7V8H1V7H2ZM10 7V8H9V7H10ZM4 2V4H2V6H1V3H2V2H4ZM10 3V6H9V3H10ZM6 2V4H5V2H6ZM9 2V3H8V2H9ZM5 1V2H4V1H5ZM7 1V2H6V1H7Z"
        fill="#AA0000"
      />
      <path d="M5 2V4H4V2H5ZM7 2V3H6V2H7ZM6 1V2H5V1H6Z" fill="#FF2C2C" />
    </svg>
  );
}
