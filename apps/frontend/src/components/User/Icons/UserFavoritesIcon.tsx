interface IconProps {
  className?: string;
}

export default function UserFavoritesIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.41667 2.5H13.5833C14.5042 2.5 15.25 3.24583 15.25 4.16667V17.5L10.0067 14.7725L4.75 17.5V4.16667C4.75 3.24583 5.49583 2.5 6.41667 2.5Z"
        stroke="#EC4899"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
