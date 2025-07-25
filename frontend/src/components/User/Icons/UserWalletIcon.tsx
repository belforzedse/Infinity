interface IconProps {
  className?: string;
}

export default function UserWalletIcon({ className }: IconProps) {
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
        d="M16.6667 12.9168H15C14.0792 12.9168 13.3334 12.171 13.3334 11.2502V11.2502C13.3334 10.3293 14.0792 9.5835 15 9.5835H16.6667C17.1267 9.5835 17.5 9.95683 17.5 10.4168V12.0835C17.5 12.5435 17.1267 12.9168 16.6667 12.9168Z"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.6667 9.58317V7.08317C16.6667 6.16234 15.9208 5.4165 15 5.4165H3.75C3.06 5.4165 2.5 4.8565 2.5 4.1665V4.1665C2.5 3.4765 3.06 2.9165 3.75 2.9165H14.1667"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.6667 12.9165V15.4165C16.6667 16.3373 15.9208 17.0832 15 17.0832H4.16667C3.24583 17.0832 2.5 16.3373 2.5 15.4165V4.1665"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
