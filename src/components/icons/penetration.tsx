import type { IIconProps } from "./types";

export function Penetration({ size = 25, color = "white" }: IIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 12H20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 2V9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 15V22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 15L22 12L19 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 9L13 6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M9 15L13 18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
