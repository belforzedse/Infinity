import React from "react";

interface SearchIconProps {
  className?: string;
}

const SearchIcon: React.FC<SearchIconProps> = ({ className = "" }) => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="9.21587"
        cy="9.21583"
        r="5.8825"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.6666 16.6667L13.3749 13.375"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default SearchIcon;
