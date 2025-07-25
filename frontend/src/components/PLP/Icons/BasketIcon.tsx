import React from "react";

interface BasketIconProps {
  isActive?: boolean;
}

const BasketIcon: React.FC<BasketIconProps> = ({ isActive = false }) => {
  const color = isActive ? "#DB2777" : "#262626";

  return (
    <svg
      width="25"
      height="24"
      viewBox="0 0 25 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.07565 14.246L6.54065 7H19.1666C19.8176 7 20.2946 7.611 20.1366 8.243L18.7886 13.635C18.5836 14.454 17.8876 15.056 17.0476 15.14L10.2316 15.822C9.21565 15.923 8.28665 15.244 8.07565 14.246Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.54066 7L5.89066 4H4.16666"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.7757 19.267C17.5737 19.267 17.4097 19.431 17.4117 19.633C17.4117 19.835 17.5757 19.999 17.7777 19.999C17.9797 19.999 18.1437 19.835 18.1437 19.633C18.1427 19.431 17.9787 19.267 17.7757 19.267"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.36365 19.267C9.16165 19.267 8.99765 19.431 8.99965 19.633C8.99765 19.836 9.16265 20 9.36465 20C9.56665 20 9.73065 19.836 9.73065 19.634C9.73065 19.431 9.56665 19.267 9.36365 19.267"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default BasketIcon;
