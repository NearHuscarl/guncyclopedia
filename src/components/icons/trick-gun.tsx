import clsx from "clsx";
import type { IIconProps } from "./types";

interface ITrickGunProps extends IIconProps {
  color1?: string;
  color2?: string;
}

export function TrickGun({ size = 18, color1, color2, className }: ITrickGunProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={clsx("lucide lucide-shuffle-icon lucide-shuffle [&_path]:transition-colors", className)}
    >
      <path stroke={color1} d="m18 2 4 4-4 4" />
      <path stroke={color1} d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22" />
      <path stroke={color2} d="m18 14 4 4-4 4" />
      <path stroke={color2} d="M2 6h1.972a4 4 0 0 1 3.6 2.2" />
      <path stroke={color2} d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45" />
    </svg>
  );
}
