interface IconProps {
  className?: string;
}

export default function CodeIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="24"
      height="25"
      viewBox="0 0 24 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15.031 10.092C15.031 9.88498 14.863 9.71798 14.656 9.71798C14.449 9.71898 14.281 9.88698 14.281 10.094C14.281 10.301 14.449 10.469 14.656 10.468C14.863 10.468 15.031 10.3 15.031 10.093"
        stroke="#DB2777"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.5 17.945L9.223 12.209C8.417 10.115 8.849 7.65299 10.534 5.96399C12.814 3.67899 16.511 3.67899 18.79 5.96399C21.07 8.24899 21.07 11.954 18.79 14.24C17.089 15.945 14.601 16.374 12.499 15.536L6.798 21.25H3.5L3.5 17.945Z"
        stroke="#DB2777"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
