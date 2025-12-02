interface IconProps {
  className?: string;
}

export default function CirculePlusIcon({ className }: IconProps) {
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
        d="M12.5 8V16"
        stroke="#EC4899"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 12H8.5"
        stroke="#EC4899"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.5 21V21C7.529 21 3.5 16.971 3.5 12V12C3.5 7.029 7.529 3 12.5 3V3C17.471 3 21.5 7.029 21.5 12V12C21.5 16.971 17.471 21 12.5 21Z"
        stroke="#EC4899"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
