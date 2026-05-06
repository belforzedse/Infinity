interface IconProps {
  className?: string;
}

export default function AccountIcon({ className }: IconProps) {
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
        d="M12.0624 3.77127C13.2015 4.9103 13.2015 6.75703 12.0624 7.89606C10.9234 9.03509 9.07668 9.03509 7.93765 7.89606C6.79862 6.75703 6.79862 4.9103 7.93765 3.77127C9.07668 2.63223 10.9234 2.63223 12.0624 3.77127"
        stroke="#EC4899"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.33337 15.4168V16.2502C3.33337 16.7102 3.70671 17.0835 4.16671 17.0835H15.8334C16.2934 17.0835 16.6667 16.7102 16.6667 16.2502V15.4168C16.6667 12.8952 13.3734 11.2568 10 11.2568C6.62671 11.2568 3.33337 12.8952 3.33337 15.4168Z"
        stroke="#EC4899"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
