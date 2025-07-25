interface IconProps {
  className?: string;
}

export default function CirculeInformationIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="12.0003"
        cy="12"
        r="9.00375"
        stroke="#DB2777"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.9995 15.5015H13.3098"
        stroke="#DB2777"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.1593 15.5015V11.2497H11.0088"
        stroke="#DB2777"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.0999 8.24569C12.0999 8.38382 11.9879 8.4958 11.8498 8.4958C11.7117 8.4958 11.5997 8.38382 11.5997 8.24569C11.5997 8.10756 11.7117 7.99559 11.8498 7.99559"
        stroke="#DB2777"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.8503 7.99558C11.9884 7.99558 12.1004 8.10755 12.1004 8.24568"
        stroke="#DB2777"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
