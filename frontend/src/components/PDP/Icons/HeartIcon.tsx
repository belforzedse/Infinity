interface HeartIconProps {
  className?: string;
  filled?: boolean;
}

export default function HeartIcon({
  className = "",
  filled = false,
}: HeartIconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill={filled ? "currentColor" : "none"}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.0833 3.33337C15.725 3.33337 17.5 5.81671 17.5 8.13337C17.5 12.825 10.1333 16.6667 10 16.6667C9.86667 16.6667 2.5 12.825 2.5 8.13337C2.5 5.81671 4.275 3.33337 6.91667 3.33337C8.43333 3.33337 9.425 4.09171 10 4.75837C10.575 4.09171 11.5667 3.33337 13.0833 3.33337Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
