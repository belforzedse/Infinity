import React from "react";

interface ChevronDownIconProps {
  className?: string;
}

const ChevronDownIcon: React.FC<ChevronDownIconProps> = ({
  className = "",
}) => {
  return (
    <svg
      width="17"
      height="16"
      viewBox="0 0 17 16"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11.4666 6.66667L8.79997 9.33334L6.1333 6.66667"
        stroke="#525252"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default ChevronDownIcon;
