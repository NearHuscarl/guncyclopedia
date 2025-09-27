import type { IIconProps } from "./types";

export function PlayerRobot({ size = 20 }: IIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="11" height="11" />
      <path d="M10 1V10H1V1H10ZM2 9H9V2H2V9Z" fill="#868686" />
      <path d="M9 2V3H2V2H9Z" fill="#0E404D" />
      <path d="M9 3V9H2V3H9ZM4 8H7V7H4V8ZM7 5V6H8V5H7ZM3 6H4V5H3V6Z" fill="#218281" />
      <path d="M7 7V8H4V7H7ZM4 5V6H3V5H4ZM8 5V6H7V5H8Z" fill="#D5BC30" />
    </svg>
  );
}
