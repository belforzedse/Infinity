interface IconProps {
  className?: string;
}

export default function ArrowLeftIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="17"
      height="16"
      viewBox="0 0 17 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.83329 5.3335L7.16663 8.00016L9.83329 10.6668"
        stroke="white"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
