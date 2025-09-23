import type { IIconProps } from "./types";

export function RestoreAmmoOnHit({ size = 20 }: IIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" />
      <path d="M3 2H7M8 3V15M2 3V14M2 15V14M4 3V7M6 3V14M6 15V14M2 14H6M1 18H9" stroke="white" strokeWidth="2" />
      <path
        d="M17 22C19.7614 22 22 19.7614 22 17C22 14.2386 19.7614 12 17 12C14.2386 12 12 14.2386 12 17C12 19.7614 14.2386 22 17 22Z"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M22 17H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 17H12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 14V12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 22V20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.5 2V7M11 4.5H16" className="stroke-green-500" strokeWidth="2" strokeLinecap="square" />
    </svg>
  );
}
