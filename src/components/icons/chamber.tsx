import type { TIconProps } from "./types";

export function Chamber({ size = 25, color = "white", className }: TIconProps) {
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
      <path
        d="M12 0.99962C18.075 0.999636 22.9998 5.92467 23 11.9996C23 18.0747 18.0751 22.9996 12 22.9996C5.9249 22.9996 1.00003 18.0748 1.00003 11.9996C1.00024 5.92466 5.92502 0.99962 12 0.99962ZM12 2.99962C7.02959 2.99962 3.00024 7.02923 3.00003 11.9996C3.00003 16.9702 7.02947 20.9996 12 20.9996C16.9706 20.9996 21 16.9702 21 11.9996C20.9998 7.02924 16.9705 2.99964 12 2.99962Z"
        fill={color}
      />
      <path
        d="M8 17C8.55228 17 9 16.5523 9 16C9 15.4477 8.55228 15 8 15C7.44772 15 7 15.4477 7 16C7 16.5523 7.44772 17 8 17Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 9C16.5523 9 17 8.55228 17 8C17 7.44772 16.5523 7 16 7C15.4477 7 15 7.44772 15 8C15 8.55228 15.4477 9 16 9Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 9C8.55228 9 9 8.55228 9 8C9 7.44772 8.55228 7 8 7C7.44772 7 7 7.44772 7 8C7 8.55228 7.44772 9 8 9Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 17C16.5523 17 17 16.5523 17 16C17 15.4477 16.5523 15 16 15C15.4477 15 15 15.4477 15 16C15 16.5523 15.4477 17 16 17Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 12H12.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
