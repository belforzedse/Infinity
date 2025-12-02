import React from "react";

interface IconProps {
  className?: string;
}

const ChevronUpIcon: React.FC<IconProps> = ({ className = "" }) => {
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
        d="M3.27639 0.414745L0.125853 5.68226C-0.219591 6.2595 0.186888 7 0.848954 7H7.15087C7.81293 7 8.21941 6.2595 7.87439 5.68226L4.72344 0.414745C4.39283 -0.138248 3.60699 -0.138248 3.27639 0.414745Z"
        fill="#C1C2C5"
      />
    </svg>
  );
};

export default ChevronUpIcon;
