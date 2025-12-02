import React from "react";

interface IconProps {
  className?: string;
}

const CopyIcon: React.FC<IconProps> = ({ className = "" }) => {
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
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.2402 12.9451V7.47922C10.2402 7.20735 10.1322 6.94661 9.93992 6.75442L8.4916 5.30614C8.29947 5.11384 8.03874 5.00586 7.76687 5.00586H4.22169C3.65592 5.00586 3.19727 5.46451 3.19727 6.03028V12.9451C3.19727 13.511 3.65592 13.9696 4.22169 13.9696H9.21576C9.78152 13.9696 10.2402 13.511 10.2402 12.9451Z"
        stroke="#DB2777"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.24 11.4085H12.4169C12.9827 11.4085 13.4414 10.9499 13.4414 10.3841V3.72536C13.4414 3.01814 12.8681 2.44482 12.1608 2.44482H7.42283C6.85709 2.44482 6.39844 2.90348 6.39844 3.46925V5.00589"
        stroke="#DB2777"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.2398 7.5669H8.19097C7.90809 7.5669 7.67871 7.33759 7.67871 7.05471V5.00586"
        stroke="#DB2777"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default CopyIcon;
