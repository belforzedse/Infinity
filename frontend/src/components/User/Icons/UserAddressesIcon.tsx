interface IconProps {
  className?: string;
}

export default function UserAddressesIcon({ className }: IconProps) {
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
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 10.8335V10.8335C8.61917 10.8335 7.5 9.71433 7.5 8.3335V8.3335C7.5 6.95266 8.61917 5.8335 10 5.8335V5.8335C11.3808 5.8335 12.5 6.95266 12.5 8.3335V8.3335C12.5 9.71433 11.3808 10.8335 10 10.8335Z"
        stroke="#EC4899"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.0001 17.5C10.0001 17.5 4.16675 12.7083 4.16675 8.33333C4.16675 5.11167 6.77842 2.5 10.0001 2.5C13.2217 2.5 15.8334 5.11167 15.8334 8.33333C15.8334 12.7083 10.0001 17.5 10.0001 17.5Z"
        stroke="#EC4899"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
