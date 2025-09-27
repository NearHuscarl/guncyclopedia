import type { IIconProps } from "./types";

export function PlayerGuide({ size = 20 }: IIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="11" height="11" />
      <path d="M9 9V10H2V9H9ZM2 6V9H1V6H2ZM10 6V9H9V6H10Z" fill="#5B1E00" />
      <path d="M3 6V7H2V6H3ZM9 6V7H8V6H9ZM4 2V4H3V5H2V6H1V3H2V2H4ZM9 2V3H10V6H9V5H8V4H7V2H9Z" fill="#151330" />
      <path d="M7 1V4H4V1H7Z" fill="#352048" />
      <path d="M8 4V5H9V6H8V7H9V9H2V7H3V6H2V5H3V4H8ZM4 8H7V7H4V8Z" fill="#913F17" />
      <path d="M7 7V8H4V7H7Z" fill="#810000" />
    </svg>
  );
}
