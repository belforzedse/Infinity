import React from "react";

interface WalletIconProps {
  className?: string;
}

const WalletIcon: React.FC<WalletIconProps> = ({ className }) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20 15.5H18C16.895 15.5 16 14.605 16 13.5V13.5C16 12.395 16.895 11.5 18 11.5H20C20.552 11.5 21 11.948 21 12.5V14.5C21 15.052 20.552 15.5 20 15.5Z"
        stroke="#94A3B8"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 11.5V8.5C20 7.395 19.105 6.5 18 6.5H4.5C3.672 6.5 3 5.828 3 5V5C3 4.172 3.672 3.5 4.5 3.5H17"
        stroke="#94A3B8"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 15.5V18.5C20 19.605 19.105 20.5 18 20.5H5C3.895 20.5 3 19.605 3 18.5V5"
        stroke="#94A3B8"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default WalletIcon;
