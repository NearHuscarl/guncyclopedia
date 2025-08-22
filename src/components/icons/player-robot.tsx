import type { TIconProps } from "./types";

export function PlayerRobot({ size = 22 }: TIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="11" height="11" />
      <path d="M1.5 9.5V1.5H9.5V9.5H1.5Z" stroke="#868686" />
      <path d="M2 2.5H9" stroke="#0E404D" />
      <path d="M2.5 8.5V3.5H8.5V8.5H2.5Z" fill="#218281" stroke="#218281" />
      <path d="M3 5.5H4M7 5.5H8M4 7.5H7" stroke="#D5BC30" />
    </svg>
  );
}
