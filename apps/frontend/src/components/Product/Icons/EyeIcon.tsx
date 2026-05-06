import React from "react";

interface EyeIconProps {
  className?: string;
}

const EyeIcon: React.FC<EyeIconProps> = ({ className }) => {
  return (
    <svg
      className={className}
      width="25"
      height="24"
      viewBox="0 0 25 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.61799 12.467C3.46099 12.176 3.46099 11.823 3.61799 11.532C5.50999 8.033 9.00499 5 12.5 5C15.995 5 19.49 8.033 21.382 11.533C21.539 11.824 21.539 12.177 21.382 12.468C19.49 15.967 15.995 19 12.5 19C9.00499 19 5.50999 15.967 3.61799 12.467Z"
        stroke="#64748B"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.6213 9.87868C15.7929 11.0502 15.7929 12.9497 14.6213 14.1213C13.4497 15.2929 11.5502 15.2929 10.3787 14.1213C9.20711 12.9497 9.20711 11.0502 10.3787 9.87868C11.5502 8.70711 13.4497 8.70711 14.6213 9.87868"
        stroke="#64748B"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default EyeIcon;
