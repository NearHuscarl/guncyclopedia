import type { IIconProps } from "./types";

export function PlayerCultist({ size = 20 }: IIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="11" height="11" />
      <path d="M2 3V6H1V3H2ZM10 3V6H9V3H10ZM5 3H4V2H3V1H8V2H7V3H6V4H5V3ZM3 2V3H2V2H3ZM9 2V3H8V2H9Z" fill="#3E3E3E" />
      <path d="M2 6V8H3V9H4V10H2V9H1V6H2ZM10 6V9H9V10H7V9H8V8H9V6H10Z" fill="#151515" />
      <path d="M4 2V3H5V4H6V3H7V2H8V3H9V8H8V9H7V10H4V9H3V8H2V3H3V2H4ZM3 7H4V6H3V7ZM7 7H8V6H7V7Z" fill="#070707" />
      <path d="M4 6V7H3V6H4ZM8 6V7H7V6H8Z" fill="#F3C800" />
    </svg>
  );
}
