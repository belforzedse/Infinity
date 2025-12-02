interface IconProps {
  className?: string;
}

export default function CalenderIcon({ className }: IconProps) {
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
        d="M6.25 3V5.5"
        stroke="#262626"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.75 3V5.5"
        stroke="#262626"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.5 8.41663H17.5"
        stroke="#262626"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 4.25H5C3.61929 4.25 2.5 5.36929 2.5 6.75V15.5C2.5 16.8807 3.61929 18 5 18H15C16.3807 18 17.5 16.8807 17.5 15.5V6.75C17.5 5.36929 16.3807 4.25 15 4.25Z"
        stroke="#262626"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
