import type { IIconProps } from "./types";

export function Chest({ size = 22, className }: IIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="24" height="24" />
      <path d="M3 13V3H21V13M3 13V21H21V13M3 13H10M21 13H14M10 13V10H14V13M10 13H14" stroke="white" strokeWidth="2" />
    </svg>
  );
}
