interface IconProps {
  className?: string;
}

export default function LoginIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="24"
      height="25"
      viewBox="0 0 24 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15.0015 12.75H4.99731"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 15.7512L15.0013 12.75L12 9.74875"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.94702 16.7517C4.37554 17.6272 4.9453 18.4262 5.63345 19.1166C8.20851 21.6917 12.0812 22.462 15.4457 21.0684C18.8101 19.6748 21.0038 16.3917 21.0038 12.75C21.0038 9.10837 18.8101 5.82527 15.4457 4.43166C12.0812 3.03805 8.20851 3.80838 5.63345 6.38344C4.94531 7.07383 4.37555 7.87281 3.94702 8.74833"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
