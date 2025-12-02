interface IconProps {
  className?: string;
}

export default function EyeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2.5 9.99999C2.5 9.99999 5.22727 4.58333 10 4.58333C14.7727 4.58333 17.5 9.99999 17.5 9.99999C17.5 9.99999 14.7727 15.4167 10 15.4167C5.22727 15.4167 2.5 9.99999 2.5 9.99999Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
