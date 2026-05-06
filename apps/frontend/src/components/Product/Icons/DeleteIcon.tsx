import React from "react";

interface DeleteIconProps {
  className?: string;
}

const DeleteIcon: React.FC<DeleteIconProps> = ({ className }) => {
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
        d="M16.0414 21H8.95857C7.78287 21 6.80537 20.0948 6.7152 18.9226L5.75 6.375H19.25L18.2848 18.9226C18.1946 20.0948 17.2171 21 16.0414 21V21Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.5 6.37521H4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.6875 3H15.3125C15.9338 3 16.4375 3.50368 16.4375 4.125V6.375H8.5625V4.125C8.5625 3.82663 8.68103 3.54048 8.892 3.3295C9.10298 3.11853 9.38913 3 9.6875 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 17.0002H14.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default DeleteIcon;
