import React from "react";

interface SortDescIconProps {
  className?: string;
}

const SortDescIcon: React.FC<SortDescIconProps> = ({ className }) => {
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
        d="M18.0025 21.0038V3.99667"
        stroke="#333333"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.99622 3.99667H12"
        stroke="#333333"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.99707 7.99832H12"
        stroke="#333333"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.99792 12H12"
        stroke="#333333"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.3985 16.0017H12"
        stroke="#333333"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.0025 21.0038L20.5035 18.5027"
        stroke="#333333"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.5015 18.5027L18.0025 21.0038"
        stroke="#333333"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default SortDescIcon;
