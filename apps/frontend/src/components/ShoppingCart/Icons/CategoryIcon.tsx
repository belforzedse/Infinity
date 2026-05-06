interface IconProps {
  className?: string;
}

export default function CategoryIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="16"
      height="17"
      viewBox="0 0 16 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.16667 8.5H3.33333C2.59667 8.5 2 7.90333 2 7.16667V3.83333C2 3.09667 2.59667 2.5 3.33333 2.5H5.16667C5.90333 2.5 6.5 3.09667 6.5 3.83333V7.16667C6.5 7.90333 5.90333 8.5 5.16667 8.5Z"
        stroke="#A3A3A3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.16667 14.5H3.33333C2.59667 14.5 2 13.9033 2 13.1667V12.8333C2 12.0967 2.59667 11.5 3.33333 11.5H5.16667C5.90333 11.5 6.5 12.0967 6.5 12.8333V13.1667C6.5 13.9033 5.90333 14.5 5.16667 14.5Z"
        stroke="#A3A3A3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.8333 8.5H12.6667C13.4033 8.5 14 9.09667 14 9.83333V13.1667C14 13.9033 13.4033 14.5 12.6667 14.5H10.8333C10.0967 14.5 9.5 13.9033 9.5 13.1667V9.83333C9.5 9.09667 10.0967 8.5 10.8333 8.5Z"
        stroke="#A3A3A3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.8333 2.5H12.6667C13.4033 2.5 14 3.09667 14 3.83333V4.16667C14 4.90333 13.4033 5.5 12.6667 5.5H10.8333C10.0967 5.5 9.5 4.90333 9.5 4.16667V3.83333C9.5 3.09667 10.0967 2.5 10.8333 2.5Z"
        stroke="#A3A3A3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
