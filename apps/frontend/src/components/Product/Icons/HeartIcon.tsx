import React from "react";

interface HeartIconProps {
  className?: string;
  filled?: boolean;
}

const HeartIcon: React.FC<HeartIconProps> = ({ className, filled = false }) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 20.25L11.8 20.1C11.5 19.9 6 15.9 4 13.3C2.5 11.3 2 9.7 2 8C2 4.7 4.7 2 8 2C9.8 2 11.5 2.9 12.5 4.3C13.5 2.9 15.2 2 17 2C20.3 2 23 4.7 23 8C23 9.7 22.5 11.3 21 13.3C19 15.9 13.5 19.9 13.2 20.1L13 20.25H12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default HeartIcon;
