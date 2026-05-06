interface IconProps {
  className?: string;
}

export default function ArrowDownIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="11"
      height="7"
      viewBox="0 0 11 7"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1.5 1.5L5.5 5.5L9.5 1.5"
        stroke="#323232"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
