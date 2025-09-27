import type { IIconProps } from "./types";

export function PlayerLamey({ size = 20 }: IIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="11" height="11" />
      <path d="M5 5V6H6V7H7V8H4V9H7V8H8V10H3V7H4V6H3V5H5ZM2 6V8H1V6H2Z" fill="#FFA145" />
      <path d="M4 6V7H2V6H4ZM9 6V7H7V6H9Z" fill="#530000" />
      <path d="M7 8V9H4V8H7Z" fill="#C90000" />
      <path d="M8 7V8H7V7H8ZM7 6V7H6V6H7ZM6 5V6H5V5H6ZM4 4V5H3V4H4Z" fill="#E15B00" />
      <path d="M3 7V10H2V7H3ZM9 7V10H8V7H9ZM3 4V6H2V4H3ZM8 1V3H9V6H6V5H4V1H8Z" fill="#1DF300" />
      <path d="M10 3V9H9V3H10ZM4 1V4H2V6H1V3H2V2H3V1H4ZM9 2V3H8V2H9Z" fill="#18C800" />
    </svg>
  );
}
