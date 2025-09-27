import type { IIconProps } from "./types";

export function Devolver({ size = 18 }: IIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="11" height="11" />
      <path d="M9 0V4H8V2H7V1H2V3H3V2H4V5H3V6H4V8H3V7H2V9H7V8H8V5H9V10H1V0H9ZM6 2V3H7V7H6V8H5V2H6Z" fill="#DA232A" />
      <path d="M7 1V2H8V4H9V5H8V8H7V9H2V7H3V8H4V6H3V5H4V2H3V3H2V1H7ZM5 8H6V7H7V3H6V2H5V8Z" fill="#FFFBF3" />
      <path d="M10 0V11H1V10H9V0H10Z" fill="#880409" />
    </svg>
  );
}
