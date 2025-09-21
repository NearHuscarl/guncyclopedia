import type { IIconProps } from "./types";

export function FinalProjectile({ size = 22, className }: IIconProps) {
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
      <path d="M3 4H7M8 5V17M2 5V16M2 17V16M4 5V9M6 5V16M6 17V16M2 16H6M1 20H9" strokeWidth="2" />
      <path d="M13 3V7H17" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M13 7L14.535 5.395C15.109 4.8433 15.8065 4.43666 16.5694 4.20891C17.3323 3.98117 18.1386 3.9389 18.9211 4.08562C19.7037 4.23235 20.4399 4.56383 21.0684 5.05248C21.697 5.54113 22.1998 6.17282 22.535 6.895"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M22 15V11H18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M22 11L20.465 12.605C19.891 13.1567 19.1935 13.5633 18.4306 13.7911C17.6677 14.0188 16.8614 14.0611 16.0789 13.9144C15.2963 13.7676 14.5601 13.4362 13.9316 12.9475C13.303 12.4589 12.8002 11.8272 12.465 11.105"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
