import type { IIconProps } from "./types";

export function IgnoreDamageCap({ size = 22, className = "white" }: IIconProps) {
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
      <path d="M12 21V3" className="stroke-white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 13H2" className="stroke-red-500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 13H6" className="stroke-red-500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 13H16" className="stroke-red-500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 13H21" className="stroke-red-500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 6L12 3L9 6" className="stroke-white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
