interface IconProps {
  className?: string;
}

export default function TransactionsIcon({ className }: IconProps) {
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
        d="M2.83325 12.833L5.83325 15.833L8.83325 12.833"
        stroke="#323232"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.83341 4.16634L5.83341 15.833"
        stroke="#323232"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.1667 7.16699L14.1667 4.16699L11.1667 7.16699"
        stroke="#323232"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.1667 15.833V4.16634"
        stroke="#323232"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
