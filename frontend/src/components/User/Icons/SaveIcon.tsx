interface IconProps {
  className?: string;
}

export default function SaveIcon({ className }: IconProps) {
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
        d="M16.164 3.5H5.00701C3.89701 3.5 2.99901 4.404 3.00701 5.515L3.11101 19.515C3.11901 20.614 4.01201 21.5 5.11101 21.5H18.992C20.097 21.5 20.992 20.605 20.992 19.5V8.328C20.992 7.798 20.781 7.289 20.406 6.914L17.578 4.086C17.203 3.711 16.695 3.5 16.164 3.5Z"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.993 3.5V7.409C15.993 7.961 15.545 8.409 14.993 8.409H8.99298C8.44098 8.409 7.99298 7.961 7.99298 7.409V3.5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 21.5V13.786C7 13.076 7.576 12.5 8.286 12.5H15.715C16.424 12.5 17 13.076 17 13.786V21.5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
