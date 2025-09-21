import type { IIconProps } from "./types";

export function Devolver({ size = 18 }: IIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="11" height="11" />
      <path
        d="M8.5 5V9.5H7.5M7.5 9.5H1.5V4.5M7.5 9.5V8M8.5 4V0.5H7.5M7.5 0.5H1.5V3.5V4.5M7.5 0.5V2M1.5 4.5H2.5M2.5 4.5V6.5H3.5V8M2.5 4.5H3.5V2M2.5 4.5V3M5.5 2V5M5.5 8V5M5.5 5H6.5M6.5 5V7M6.5 5V3"
        stroke="#DA232A"
      />
      <path
        d="M2.5 3V1.5H4.5M2.5 7V8.5H4.5M4.5 8.5H6.5V7.5H7.5V4.5M4.5 8.5V5.5M4.5 1.5H6.5V2.5H7.5V4.5M4.5 1.5V5.5M4.5 5.5H3M7.5 4.5H9"
        stroke="#FFFBF3"
      />
      <path d="M9.5 0V10.5H1" stroke="#880409" />
    </svg>
  );
}
