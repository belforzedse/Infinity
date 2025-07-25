import React from "react";

interface CategoryIconProps {
  isActive?: boolean;
}

const CategoryIcon: React.FC<CategoryIconProps> = ({ isActive = false }) => {
  const color = isActive ? "#DB2777" : "#525252";

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="3"
        y="3"
        width="6.75"
        height="6.75"
        rx="1"
        stroke={color}
        strokeWidth="1.5"
      />
      <rect
        x="14.25"
        y="3"
        width="6.75"
        height="6.75"
        rx="1"
        stroke={color}
        strokeWidth="1.5"
      />
      <rect
        x="3"
        y="14.25"
        width="6.75"
        height="6.75"
        rx="1"
        stroke={color}
        strokeWidth="1.5"
      />
      <rect
        x="14.25"
        y="14.25"
        width="6.75"
        height="6.75"
        rx="1"
        stroke={color}
        strokeWidth="1.5"
      />
    </svg>
  );
};

export default CategoryIcon;
