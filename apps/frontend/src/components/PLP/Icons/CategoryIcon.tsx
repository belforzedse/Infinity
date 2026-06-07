import React from "react";

type CategoryIconProps = {
  className?: string;
};

const CategoryIcon: React.FC<CategoryIconProps> = ({ className }) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect x="3" y="3" width="6.75" height="6.75" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="14.25" y="3" width="6.75" height="6.75" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="14.25" width="6.75" height="6.75" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect
        x="14.25"
        y="14.25"
        width="6.75"
        height="6.75"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
};

export default CategoryIcon;
