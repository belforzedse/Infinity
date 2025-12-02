interface IconProps {
  className?: string;
}

export default function FactorIcon({ className }: IconProps) {
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
        d="M16.5 7H8.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.63 11H8.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.5 19.191V4C4.5 3.448 4.948 3 5.5 3H19.5C20.052 3 20.5 3.448 20.5 4V19.191C20.5 19.563 20.109 19.804 19.776 19.638L17.833 18.666L15.39 19.888C15.249 19.958 15.084 19.958 14.943 19.888L12.5 18.667L10.057 19.889C9.916 19.959 9.751 19.959 9.61 19.889L7.167 18.667L5.224 19.639C4.891 19.804 4.5 19.563 4.5 19.191Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.5 15H8.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
