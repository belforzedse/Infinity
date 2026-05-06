import React from "react";

interface IconProps {
  className?: string;
}

const ChevronDownIcon: React.FC<IconProps> = ({ className = "" }) => {
  return (
    <svg
      className={className}
      width="8"
      height="7"
      viewBox="0 0 8 7"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.27639 6.58525L0.125853 1.31774C-0.219591 0.740499 0.186888 0 0.848954 0H7.15087C7.81293 0 8.21941 0.740499 7.87439 1.31774L4.72344 6.58525C4.39283 7.13825 3.60699 7.13825 3.27639 6.58525Z"
        fill="#EC4899"
      />
    </svg>
  );
};

export default ChevronDownIcon;
