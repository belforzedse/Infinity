import React from "react";

interface ArrowDownIconProps {
  className?: string;
}

const ArrowDownIcon: React.FC<ArrowDownIconProps> = ({ className }) => {
  return (
    <svg
      className={className}
      width="24"
      height="25"
      viewBox="0 0 24 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.99487 10.5005L11.9949 14.5005L15.9949 10.5005"
        stroke="#94A3B8"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default ArrowDownIcon;
