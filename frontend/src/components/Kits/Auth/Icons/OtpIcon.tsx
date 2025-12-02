interface IconProps {
  className?: string;
}

export default function OtpIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="25"
      height="25"
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.349 17.146C21.079 15.846 21.5 14.348 21.5 12.75C21.5 7.779 17.471 3.75 12.5 3.75C7.529 3.75 3.5 7.779 3.5 12.75C3.5 17.721 7.529 21.75 12.5 21.75C14.098 21.75 15.596 21.329 16.896 20.599L21.5 21.75L20.349 17.146Z"
        stroke="#DB2777"
        strokeWidth="1.5882"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.3231 13.073C12.4211 12.975 12.5791 12.975 12.6771 13.073C12.7751 13.171 12.7751 13.329 12.6771 13.427C12.5791 13.525 12.4211 13.525 12.3231 13.427C12.2261 13.329 12.2261 13.171 12.3231 13.073"
        stroke="#DB2777"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.32311 13.073C8.42111 12.975 8.57911 12.975 8.67711 13.073C8.77511 13.171 8.77511 13.329 8.67711 13.427C8.57911 13.525 8.42111 13.525 8.32311 13.427C8.22611 13.329 8.22611 13.171 8.32311 13.073"
        stroke="#DB2777"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.3231 13.073C16.4211 12.975 16.5791 12.975 16.6771 13.073C16.7751 13.171 16.7751 13.329 16.6771 13.427C16.5791 13.525 16.4211 13.525 16.3231 13.427C16.2261 13.329 16.2261 13.171 16.3231 13.073"
        stroke="#DB2777"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
