interface IconProps {
  className?: string;
}

export default function EditIcon({ className }: IconProps) {
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
        d="M17.5 10.8892V15.81C17.5 16.7434 16.7492 17.5 15.8225 17.5H4.1775C3.25083 17.5 2.5 16.7434 2.5 15.81V5.02337C2.5 4.09004 3.25083 3.33337 4.1775 3.33337H10"
        stroke="#323232"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.52344 14.31L9.6326 13.5325C9.77927 13.4958 9.9126 13.42 10.0201 13.3133L17.0118 6.32162C17.6626 5.67079 17.6626 4.61579 17.0118 3.96495L16.8684 3.82162C16.2176 3.17079 15.1626 3.17079 14.5118 3.82162L7.5201 10.8133C7.41344 10.92 7.3376 11.0541 7.30094 11.2008L6.52344 14.31"
        stroke="#323232"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.1917 5.1416L15.6917 7.6416"
        stroke="#323232"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.62177 13.5349C9.63344 13.4466 9.64844 13.3591 9.64844 13.2674C9.64844 12.1166 8.71594 11.1841 7.56511 11.1841C7.47344 11.1841 7.38594 11.1999 7.29761 11.2107"
        stroke="#323232"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
