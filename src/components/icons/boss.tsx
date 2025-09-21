import type { IIconProps } from "./types";

export function Boss({ size = 20 }: IIconProps) {
  return (
    <svg height={size} viewBox="0 0 13 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="13" height="17" />
      <path
        d="M3.5 2V3.5H2.5V5.5H3.5M3.5 5.5V6.5H10M3.5 5.5H6M3.5 5.5V4M10 5.5H11M2.5 7V8.5H5.5V9.5M5.5 13.5H7M5.5 13.5V15M5.5 13.5H3.5M5.5 13.5V9.5M3.5 13.5V15M3.5 13.5V12.5M3.5 12.5H2.5V11M3.5 12.5H5M5.5 9.5H4M7.5 14V15"
        stroke="#C77000"
      />
      <path
        d="M6.5 4.5H4.5V3.5M6.5 4.5V5.5H9.5V4.5M6.5 4.5H9.5M9.5 4.5H10.5V3.5M10.5 3V3.5M10 2.5H7.5H4.5V3.5M10.5 7V8.5H6.5V10.5H7.5M7.5 10.5V9.5H9M7.5 10.5V13.5H9.5M9.5 13.5V15M9.5 13.5V12.5M9.5 12.5H10.5V11M9.5 12.5H8M4.5 3.5H10.5"
        stroke="#DDB928"
      />
      <path
        d="M2 6.5H3M3 7.5H10M10 6.5H11M2.5 9V10.5H3.5M3.5 10.5V11.5H4.5V10M3.5 10.5V9M6.5 11V13M9 9.5H10.5V10.5H9.5V11.5H8.5V10.5V10"
        stroke="black"
      />
    </svg>
  );
}
