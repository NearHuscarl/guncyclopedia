import type { IIconProps } from "./types";

export function AmmoIcon({ size = 20, color = "white" }: IIconProps) {
  const originalW = 6;
  const originalH = 11;
  const ratio = originalW / originalH;

  const h = size; // use given size as height
  const w = h * ratio; // scale width based on ratio

  return (
    <svg width={w} height={h} viewBox="0 0 12 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="12" height="24" />
      <path
        d="M10 19V21H2V19H10ZM4 5V3H8V5H10V17H2V5H4ZM4 15H6V9H4V15Z"
        className="transition-colors duration-150"
        fill={color}
      />
    </svg>
  );
}
