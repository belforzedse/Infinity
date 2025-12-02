import React from "react";

interface PlusIconProps {
  className?: string;
}

const PlusIcon: React.FC<PlusIconProps> = ({ className }) => {
  return (
    <svg
      className={className}
      width="25"
      height="25"
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12.5 5.5V19.5M5.5 12.5H19.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default PlusIcon;
