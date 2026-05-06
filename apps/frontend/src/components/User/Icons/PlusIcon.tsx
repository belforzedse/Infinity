interface IconProps {
  className?: string;
}

export default function PlusIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="10"
      height="9"
      viewBox="0 0 10 9"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.83334 0.666992V8.33366"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1 4.5H8.66667"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
