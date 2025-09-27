import type { IIconProps } from "./types";

export function PlayerEevee({ size = 20 }: IIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="11" height="11" />
      <path d="M7 7V8H6V7H7Z" fill="#490977" />
      <path d="M2 9V10H1V9H2ZM10 7V8H8V10H7V7H10ZM2 1V4H4V2H5V5H1V1H2Z" fill="#EF3D88" />
      <path d="M9 1V2H10V6H9V4H8V2H6V1H9Z" fill="#1E4A2F" />
      <path d="M8 2V4H6V2H8Z" fill="#4F854E" />
      <path d="M9 6V7H8V6H9Z" fill="#152E25" />
      <path d="M7 9V10H6V9H7ZM9 9V10H8V9H9ZM10 8V9H9V8H10ZM10 6V7H9V6H10Z" fill="#4D0754" />
      <path d="M9 4V6H8V5H6V4H9Z" fill="#03150D" />
      <path d="M4 6V7H3V6H4Z" fill="#11D731" />
      <path d="M7 8V9H6V8H7ZM9 8V9H8V8H9ZM8 6V7H6V6H8Z" fill="#7F2088" />
      <path d="M8 5V6H6V5H8Z" fill="#AF31D2" />
      <path d="M6 1V2H5V1H6Z" fill="#A43BEF" />
      <path d="M2 5V6H1V5H2ZM4 2V4H2V2H4ZM6 2V4H5V2H6ZM5 1V2H4V1H5Z" fill="#600C9D" />
      <path d="M6 5V6H2V5H6Z" fill="#F585EC" />
      <path d="M3 6V7H4V6H6V8H4V9H6V10H3V9H2V8H1V6H3Z" fill="#F153E4" />
      <path d="M6 8V9H4V8H6ZM6 4V5H5V4H6Z" fill="#2F064D" />
    </svg>
  );
}
