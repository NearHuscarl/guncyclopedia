import type { TIconProps } from "./types";

export function BlankDuringReload({ size = 22, color = "white" }: TIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_35_5)">
        <rect width="24" height="24" />
        <path
          d="M4.15789 4.78947V6.05263H5.42105V7.31579H6.68421V8.57895H7.94737V9.8421H9.21053V8.57895H10.4737V7.31579H11.7368V6.05263H10.4737V4.78947H9.21053V3.52632H7.94737V2.26316H6.68421V3.52632H5.42105V4.78947H4.15789Z"
          fill={color}
        />
        <path
          d="M1 7.31579H2.89474V8.57895H4.15789V9.8421H5.42105V11.1053H6.68421V13M8.57895 1H10.4737V2.26316H11.7368V3.52632H13V5.42105M4.15789 4.78947V6.05263H5.42105V7.31579H6.68421V8.57895H7.94737V9.8421H9.21053V8.57895H10.4737V7.31579H11.7368V6.05263H10.4737V4.78947H9.21053V3.52632H7.94737V2.26316H6.68421V3.52632H5.42105V4.78947H4.15789Z"
          stroke={color}
          stroke-width="1.26316"
        />
        <path d="M12 10V14H16" stroke={color} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        <path
          d="M12 14L13.535 12.395C14.109 11.8433 14.8065 11.4367 15.5694 11.2089C16.3323 10.9812 17.1386 10.9389 17.9211 11.0856C18.7037 11.2323 19.4399 11.5638 20.0684 12.0525C20.697 12.5411 21.1998 13.1728 21.535 13.895"
          stroke={color}
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path d="M22 22V18H18" stroke={color} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        <path
          d="M22 18L20.465 19.605C19.891 20.1567 19.1935 20.5633 18.4306 20.7911C17.6677 21.0188 16.8614 21.0611 16.0789 20.9144C15.2963 20.7676 14.5601 20.4362 13.9316 19.9475C13.303 19.4589 12.8002 18.8272 12.465 18.105"
          stroke={color}
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_35_5">
          <rect width="24" height="24" fill={color} />
        </clipPath>
      </defs>
    </svg>
  );
}
