import React from "react";

interface NoDataIconProps {
  className?: string;
}

export default function NoDataIcon({ className = "" }: NoDataIconProps) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
    >
      <path
        d="M40 7.5C21.9875 7.5 7.5 21.9875 7.5 40C7.5 58.0125 21.9875 72.5 40 72.5C58.0125 72.5 72.5 58.0125 72.5 40C72.5 21.9875 58.0125 7.5 40 7.5ZM57.5 44.375C57.5 45.55 56.55 46.5 55.375 46.5H24.625C23.45 46.5 22.5 45.55 22.5 44.375V35.625C22.5 34.45 23.45 33.5 24.625 33.5H55.375C56.55 33.5 57.5 34.45 57.5 35.625V44.375Z"
        fill="currentColor"
      />
    </svg>
  );
}
