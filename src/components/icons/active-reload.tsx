import type { IIconProps } from "./types";

export function ActiveReload({ size = 20, color = "white" }: IIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_38_2)">
        <rect width="24" height="24" />
        <path d="M12 10V14H16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path
          d="M12 14L13.535 12.395C14.109 11.8433 14.8065 11.4367 15.5694 11.2089C16.3323 10.9812 17.1386 10.9389 17.9211 11.0856C18.7037 11.2323 19.4399 11.5638 20.0684 12.0525C20.697 12.5411 21.1998 13.1728 21.535 13.895"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M22 22V18H18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path
          d="M22 18L20.465 19.605C19.891 20.1567 19.1935 20.5633 18.4306 20.7911C17.6677 21.0188 16.8614 21.0611 16.0789 20.9144C15.2963 20.7676 14.5601 20.4362 13.9316 19.9475C13.303 19.4589 12.8002 18.8272 12.465 18.105"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M1.5 7V5.5L5.5 1.5L9.5 5.5V7H7.5V13.5H3.5V7H2.5H1.5Z" fill={color} stroke={color} />
      </g>
      <defs>
        <clipPath id="clip0_38_2">
          <rect width="24" height="24" fill={color} />
        </clipPath>
      </defs>
    </svg>
  );
}
