import type { IIconProps } from "./types";

export function PlayerConvict({ size = 20 }: IIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="11" height="11" />
      <path d="M5 5V6H6V7H7V8H4V9H7V8H8V10H3V9H2V8H1V6H2V5H5ZM3 7H4V6H3V7Z" fill="#FFA145" />
      <path d="M7 8V9H4V8H7Z" fill="#530000" />
      <path d="M4 6V7H3V6H4Z" fill="#0063E9" />
      <path d="M9 8V9H8V8H9ZM8 7V8H7V7H8ZM7 6V7H6V6H7ZM6 5V6H5V5H6ZM4 4V5H2V4H4Z" fill="#E15B00" />
      <path d="M8 1V2H9V3H10V9H9V8H8V7H7V6H6V5H8V3H6V5H4V4H2V6H1V3H2V2H3V1H8Z" fill="#F3C800" />
      <path d="M8 3V5H6V3H8Z" fill="white" />
    </svg>
  );
}
