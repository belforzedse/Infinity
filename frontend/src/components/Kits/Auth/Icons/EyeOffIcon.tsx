interface IconProps {
  className?: string;
}

export default function EyeOffIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_1_1127)">
        <path
          d="M14.95 14.95C13.5255 16.0358 11.7909 16.6374 10 16.6667C5.22727 16.6667 2.5 11.25 2.5 11.25C3.34316 9.80896 4.44361 8.54759 5.75 7.54999M8.25 6.18333C8.81372 6.05902 9.39821 5.99592 9.98409 5.99583C14.7727 5.99583 17.5 11.25 17.5 11.25C17.0875 11.9674 16.6155 12.6502 16.0875 13.2917M11.7375 11.7333C11.5374 11.9447 11.2985 12.1135 11.0336 12.2304C10.7687 12.3473 10.4829 12.4099 10.1931 12.4148C9.90332 12.4197 9.61533 12.3668 9.34633 12.2589C9.07733 12.151 8.83268 11.9904 8.62545 11.7859C8.41823 11.5814 8.25445 11.339 8.14323 11.0717C8.03201 10.8044 7.97565 10.5175 7.97702 10.2277C7.97839 9.93789 8.03747 9.65194 8.15105 9.38596C8.26462 9.11997 8.43027 8.87923 8.63864 8.67666"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2.5 2.5L17.5 17.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_1_1127">
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
