import React from "react";

interface ProfileIconProps {
  isActive?: boolean;
}

const ProfileIcon: React.FC<ProfileIconProps> = ({ isActive = false }) => {
  const color = isActive ? "#DB2777" : "#262626";

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20 20V19.25C20 16.9028 18.0972 15 15.75 15H8.25C5.90279 15 4 16.9028 4 19.25V20"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="7"
        r="4"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default ProfileIcon;
