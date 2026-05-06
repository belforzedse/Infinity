interface IconProps {
  className?: string;
}

export default function MinusIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="10"
      height="3"
      viewBox="0 0 10 3"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1 1.5H8.66667"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
