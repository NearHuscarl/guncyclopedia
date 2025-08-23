import { stone600 } from "@/modules/shared/settings/tailwind";
import type { IIconProps } from "./types";

export function Bounce({ size = 25, color = stone600 }: IIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 12V18H16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M2 18.5L6 15L12 9.5L16 13L22 18M21 7H3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
