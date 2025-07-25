interface IconProps {
  className?: string;
}

export default function LogoutIcon({ className }: IconProps) {
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
        d="M14.7142 5.78564C17.3175 8.38898 17.3175 12.6106 14.7142 15.214C12.1109 17.8173 7.88921 17.8173 5.28587 15.214C2.68254 12.6106 2.68254 8.38898 5.28587 5.78564"
        stroke="#EC4899"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 3.8335V10.5002"
        stroke="#EC4899"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
