import React from "react";

interface IconProps {
  className?: string;
}

const ChevronRightIcon: React.FC<IconProps> = ({ className = "" }) => {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.66683 5.3335L9.3335 8.00016L6.66683 10.6668"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default ChevronRightIcon;
