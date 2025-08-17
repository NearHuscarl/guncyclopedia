import type { TIconProps } from "./types";

export function Boss({ size = 25 }: TIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="17" height="17" />
      <path
        d="M5.5 2V3.5H4.5V5.5H5.5M5.5 5.5V6.5H12M5.5 5.5H8M5.5 5.5V4M12 5.5H13M4.5 7V8.5H7.5V9.5M7.5 13.5H9M7.5 13.5V15M7.5 13.5H5.5M7.5 13.5V9.5M5.5 13.5V15M5.5 13.5V12.5M5.5 12.5H4.5V11M5.5 12.5H7M7.5 9.5H6M9.5 14V15"
        stroke="#C77000"
      />
      <path
        d="M8.5 4.5H6.5V3.5M8.5 4.5V5.5H11.5V4.5M8.5 4.5H11.5M11.5 4.5H12.5V3.5M12.5 3V3.5M12 2.5H9.5H6.5V3.5M12.5 7V8.5H8.5V10.5H9.5M9.5 10.5V9.5H11M9.5 10.5V13.5H11.5M11.5 13.5V15M11.5 13.5V12.5M11.5 12.5H12.5V11M11.5 12.5H10M6.5 3.5H12.5"
        stroke="#DDB928"
      />
      <path
        d="M4 6.5H5M5 7.5H12M12 6.5H13M4.5 9V10.5H5.5M5.5 10.5V11.5H6.5V10M5.5 10.5V9M8.5 11V13M11 9.5H12.5V10.5H11.5V11.5H10.5V10.5V10"
        stroke="black"
      />
    </svg>
  );
}
