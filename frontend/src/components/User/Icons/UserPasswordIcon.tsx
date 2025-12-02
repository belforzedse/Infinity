interface IconProps {
  className?: string;
}

export default function UserPasswordIcon({ className }: IconProps) {
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
        d="M12.5258 7.78497C12.5258 7.61247 12.3858 7.47331 12.2133 7.47331C12.0408 7.47414 11.9008 7.61414 11.9008 7.78664C11.9008 7.95914 12.0408 8.09914 12.2133 8.09831C12.3858 8.09831 12.5258 7.95831 12.5258 7.78581"
        stroke="#EC4899"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.91663 14.3293L7.68579 9.54928C7.01413 7.80428 7.37413 5.75262 8.77829 4.34512C10.6783 2.44095 13.7591 2.44095 15.6583 4.34512C17.5583 6.24928 17.5583 9.33678 15.6583 11.2418C14.2408 12.6626 12.1675 13.0201 10.4158 12.3218L5.66496 17.0835H2.91663L2.91663 14.3293Z"
        stroke="#EC4899"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
