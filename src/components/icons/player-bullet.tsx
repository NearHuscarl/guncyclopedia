import type { IIconProps } from "./types";

export function PlayerBullet({ size = 20 }: IIconProps) {
  return (
    <svg height={size} viewBox="0 0 9 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="9" height="11" />
      <path d="M2 1V8H7V1H8V10H7V9H2V10H1V1H2Z" fill="#E15B00" />
      <path d="M7 9V10H2V9H7ZM3 7V8H2V7H3ZM7 7V8H6V7H7ZM7 1V6H6V7H3V6H2V1H7Z" fill="#F3C800" />
      <path d="M6 7V8H3V7H6ZM3 6V7H2V6H3ZM7 6V7H6V6H7Z" fill="#242931" />
    </svg>
  );
}
