import type { IIconProps } from "./types";

export function BlankOnCollision({ size = 20 }: IIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" />
      <path
        d="M4.15789 5.78947V7.05263H5.42105V8.31579H6.68421V9.57895H7.94737V10.8421H9.21053V9.57895H10.4737V8.31579H11.7368V7.05263H10.4737V5.78947H9.21053V4.52632H7.94737V3.26316H6.68421V4.52632H5.42105V5.78947H4.15789Z"
        fill="white"
      />
      <path
        d="M1 8.31579H2.89474V9.57895H4.15789V10.8421H5.42105V12.1053H6.68421V14M8.57895 2H10.4737V3.26316H11.7368V4.52632H13V6.42105M4.15789 5.78947V7.05263H5.42105V8.31579H6.68421V9.57895H7.94737V10.8421H9.21053V9.57895H10.4737V8.31579H11.7368V7.05263H10.4737V5.78947H9.21053V4.52632H7.94737V3.26316H6.68421V4.52632H5.42105V5.78947H4.15789Z"
        stroke="white"
        strokeWidth="1.26316"
      />
      <path
        d="M16 12L14 14L9 14.5L13.5 17L14 18.5L14.5 22L16.5 18.5L18 18L22.5 17.5L20 16L18 14.5L17.5 13.5L17 9.5L16 12Z"
        stroke="white"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
