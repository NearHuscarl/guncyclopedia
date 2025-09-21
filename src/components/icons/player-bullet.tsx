import type { IIconProps } from "./types";

export function PlayerBullet({ size = 20 }: IIconProps) {
  return (
    <svg height={size} viewBox="0 0 9 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="9" height="11" />
      <path d="M1.5 1V8.5M1.5 10V8.5M1.5 8.5H7.5M7.5 1V8.5M7.5 10V8.5" stroke="#E15B00" />
      <path d="M3.5 5.5H2.5V1.5H6.5V5.5H5.5V6.5H3.5V5.5Z" fill="#F3C800" />
      <path d="M2.5 1V1.5M2.5 1.5V5.5H3.5V6.5H5.5V5.5H6.5V1.5H2.5ZM2.5 7V8M6.5 7V8M2 9.5H7" stroke="#F3C800" />
      <path d="M2 6.5H3M3 7.5H6M6 6.5H7" stroke="#242931" />
    </svg>
  );
}
