import type { IIconProps } from "./types";

export function Penetration({ size = 18, className }: IIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M2 12H20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 2V9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 15V22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 15L22 12L19 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 9L13 6" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 15L13 18" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
