interface IconProps {
  className?: string;
}

export default function ViewIcon({ className }: IconProps) {
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
        d="M1.66663 10C1.66663 10 4.16663 4.16663 9.99996 4.16663C15.8333 4.16663 18.3333 10 18.3333 10C18.3333 10 15.8333 15.8333 9.99996 15.8333C4.16663 15.8333 1.66663 10 1.66663 10Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.99996 12.5C11.3807 12.5 12.5 11.3807 12.5 9.99996C12.5 8.61925 11.3807 7.49996 9.99996 7.49996C8.61925 7.49996 7.49996 8.61925 7.49996 9.99996C7.49996 11.3807 8.61925 12.5 9.99996 12.5Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
