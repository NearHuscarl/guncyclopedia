import type { IIconProps } from "./types";

export function PlayerNinja({ size = 20 }: IIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="11" height="11" />
      <path
        d="M3 9V10H2V9H3ZM9 9V10H8V9H9ZM2 8V9H1V8H2ZM10 8V9H9V8H10ZM4 1V2H3V3H2V5H1V2H2V1H4ZM9 1V2H10V5H9V3H8V2H7V1H9Z"
        fill="#000436"
      />
      <path d="M2 5V7H1V5H2ZM6 5V7H5V5H6ZM10 5V7H9V5H10Z" fill="#F10600" />
      <path d="M4 9V10H3V9H4ZM8 9V10H7V9H8ZM3 8V9H2V8H3ZM9 8V9H8V8H9ZM2 7V8H1V7H2ZM10 7V8H9V7H10Z" fill="#00021D" />
      <path d="M5 5V7H4V5H5ZM6 4V5H5V4H6Z" fill="#FF7572" />
      <path d="M6 7V8H5V7H6ZM7 5V7H6V5H7Z" fill="#813A00" />
      <path d="M6 1V4H5V5H4V7H5V8H6V10H4V9H3V8H2V3H3V2H4V1H6Z" fill="#FFE690" />
      <path d="M7 1V2H8V3H9V8H8V9H7V10H6V7H7V5H6V1H7Z" fill="white" />
    </svg>
  );
}
