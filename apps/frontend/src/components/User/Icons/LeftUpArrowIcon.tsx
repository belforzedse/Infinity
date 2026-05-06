interface IconProps {
  className?: string;
}

export default function LeftUpArrowIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="20"
      height="21"
      viewBox="0 0 20 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5.87504 6.50879L14.125 14.4288"
        stroke="white"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.6667 6.46875L5.87508 6.50795L5.83341 12.0687"
        stroke="white"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
