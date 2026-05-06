import React from "react";

interface HomeIconProps {
  isActive?: boolean;
}

const HomeIcon: React.FC<HomeIconProps> = ({ isActive = false }) => {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1 6.5L9 1L17 6.5V16C17 16.5304 16.7893 17.0391 16.4142 17.4142C16.0391 17.7893 15.5304 18 15 18H3C2.46957 18 1.96086 17.7893 1.58579 17.4142C1.21071 17.0391 1 16.5304 1 16V6.5Z"
        stroke={isActive ? "#DB2777" : "#262626"}
        strokeWidth="1.5"
      />
    </svg>
  );
};

export default HomeIcon;
