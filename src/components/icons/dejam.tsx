import type { IIconProps } from "./types";

export function Dejam({ size = 22, className }: IIconProps) {
  return (
    <svg
      width={size}
      height="24"
      viewBox="0 0 22 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="22" height="24" />
      <path
        d="M11.5 17L11 16L10.5 17H11.5Z"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 2.99792C12.5938 2.99792 14.1513 3.474 15.4728 4.36509C16.7942 5.25619 17.8194 6.52169 18.4168 7.99931C19.0142 9.47693 19.1566 11.0993 18.8258 12.6584C18.5 15 17 18 17 18C17 18 15.5 21.5 14 22"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="2 4"
        // strokeOpacity={0.7}
      />
      <path
        d="M6.52724 4.3651C5.2058 5.25619 4.18065 6.52169 3.58324 7.99931C2.98583 9.47694 2.84341 11.0993 3.17423 12.6584C3.50505 14.2175 4.29403 15.6423 5.44 16.75C5.20457 17.0441 5.05696 17.3986 5.01419 17.7729C4.97141 18.1471 5.0352 18.5259 5.1982 18.8655C5.36121 19.2051 5.61681 19.4917 5.93557 19.6924C6.25434 19.8932 6.62331 19.9998 7 20V21C7 21.2652 7.10536 21.5196 7.29289 21.7071C7.48043 21.8946 7.73478 22 8 22H11"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 13C14.5523 13 15 12.5523 15 12C15 11.4477 14.5523 11 14 11C13.4477 11 13 11.4477 13 12C13 12.5523 13.4477 13 14 13Z"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 13C8.55228 13 9 12.5523 9 12C9 11.4477 8.55228 11 8 11C7.44772 11 7 11.4477 7 12C7 12.5523 7.44772 13 8 13Z"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
