import React from "react";

interface MoreIconProps {
  className?: string;
}

const MoreIcon: React.FC<MoreIconProps> = ({ className }) => {
  return (
    <svg
      width="24"
      height="24"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17.5 12.003C17.5 12.278 17.725 12.503 18 12.5C18.275 12.5 18.5 12.275 18.5 12C18.5 11.725 18.275 11.5 18 11.5C17.725 11.5 17.5 11.725 17.5 12.003Z"
        stroke="#EC4899"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.5 12.003C11.5 12.278 11.725 12.503 12 12.5C12.275 12.5 12.5 12.275 12.5 12C12.5 11.725 12.275 11.5 12 11.5C11.725 11.5 11.5 11.725 11.5 12.003Z"
        stroke="#EC4899"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 12.003C5.5 12.278 5.725 12.503 6 12.5C6.275 12.5 6.5 12.275 6.5 12C6.5 11.725 6.275 11.5 6 11.5C5.725 11.5 5.5 11.725 5.5 12.003Z"
        stroke="#EC4899"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default MoreIcon;
