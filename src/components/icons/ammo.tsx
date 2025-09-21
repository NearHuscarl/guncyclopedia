import type { IIconProps } from "./types";

export function AmmoIcon({ size = 20, color = "white" }: IIconProps) {
  const originalW = 6;
  const originalH = 11;
  const ratio = originalW / originalH;

  const h = size; // use given size as height
  const w = h * ratio; // scale width based on ratio

  return (
    <svg width={w} height={h} viewBox="0 0 6 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        className="transition-colors duration-150"
        d="M2 1.5H4M4.5 2V8M1.5 2V7.5M1.5 8V7.5M2.5 2V4M3.5 2V7.5M3.5 8V7.5M1.5 7.5H3.5M1 9.5H5"
        stroke={color}
      />
    </svg>
  );
}
