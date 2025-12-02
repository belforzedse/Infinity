import React from "react";

interface GridIconProps {
  className?: string;
}

const GridIcon: React.FC<GridIconProps> = ({ className }) => {
  return (
    <svg
      width="16"
      height="16"
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.16667 8H3.33333C2.59667 8 2 7.40333 2 6.66667V3.33333C2 2.59667 2.59667 2 3.33333 2H5.16667C5.90333 2 6.5 2.59667 6.5 3.33333V6.66667C6.5 7.40333 5.90333 8 5.16667 8Z"
        stroke="#A3A3A3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.16667 14H3.33333C2.59667 14 2 13.4033 2 12.6667V12.3333C2 11.5967 2.59667 11 3.33333 11H5.16667C5.90333 11 6.5 11.5967 6.5 12.3333V12.6667C6.5 13.4033 5.90333 14 5.16667 14Z"
        stroke="#A3A3A3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.8333 8H12.6667C13.4033 8 14 8.59667 14 9.33333V12.6667C14 13.4033 13.4033 14 12.6667 14H10.8333C10.0967 14 9.5 13.4033 9.5 12.6667V9.33333C9.5 8.59667 10.0967 8 10.8333 8Z"
        stroke="#A3A3A3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.8333 2H12.6667C13.4033 2 14 2.59667 14 3.33333V3.66667C14 4.40333 13.4033 5 12.6667 5H10.8333C10.0967 5 9.5 4.40333 9.5 3.66667V3.33333C9.5 2.59667 10.0967 2 10.8333 2Z"
        stroke="#A3A3A3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default GridIcon;
