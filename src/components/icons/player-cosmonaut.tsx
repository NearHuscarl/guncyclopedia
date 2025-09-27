import type { IIconProps } from "./types";

export function PlayerCosmonaut({ size = 20 }: IIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="11" height="11" />
      <path d="M8 7V8H3V7H8ZM3 6V7H2V6H3ZM9 6V7H8V6H9ZM9 1V2H10V5H9V3H8V2H3V3H2V6H1V2H2V1H9Z" fill="#ECEBD7" />
      <path d="M8 6V7H3V6H8ZM3 3V6H2V3H3ZM9 3V6H8V3H9ZM8 2V3H3V2H8Z" fill="#EDC900" />
      <path d="M10 5V9H9V10H2V9H1V6H2V7H3V8H8V7H9V5H10Z" fill="#8A8A8A" />
      <path d="M5 5V6H4V5H5ZM7 5V6H6V5H7ZM8 3V4H3V3H8Z" fill="#24333D" />
      <path d="M8 4V6H7V5H6V6H5V5H4V6H3V4H8Z" fill="#3C5768" />
    </svg>
  );
}
