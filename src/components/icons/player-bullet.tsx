import type { TIconProps } from "./types";

export function PlayerBullet({ size = 22 }: TIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="11" height="11" />
      <path d="M2.5 1V8.5M2.5 10V8.5M2.5 8.5H8.5M8.5 1V8.5M8.5 10V8.5" stroke="#E15B00" />
      <path d="M4.5 5.5H3.5V1.5H7.5V5.5H6.5V6.5H4.5V5.5Z" fill="#F3C800" />
      <path d="M3.5 1V1.5M3.5 1.5V5.5H4.5V6.5H6.5V5.5H7.5V1.5H3.5ZM3.5 7V8M7.5 7V8M3 9.5H8" stroke="#F3C800" />
      <path d="M3 6.5H4M4 7.5H7M7 6.5H8" stroke="#242931" />
    </svg>
  );
}
