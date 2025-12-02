interface IconProps {
  className?: string;
  color?: string;
}

export default function EditIcon({ className, color = "white" }: IconProps) {
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
        d="M17.5 11.1391V16.06C17.5 16.9933 16.7492 17.75 15.8225 17.75H4.1775C3.25083 17.75 2.5 16.9933 2.5 16.06V5.27331C2.5 4.33998 3.25083 3.58331 4.1775 3.58331H10"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.52344 14.56L9.6326 13.7825C9.77927 13.7458 9.9126 13.67 10.0201 13.5633L17.0118 6.57168C17.6626 5.92085 17.6626 4.86585 17.0118 4.21502L16.8684 4.07168C16.2176 3.42085 15.1626 3.42085 14.5118 4.07168L7.5201 11.0633C7.41344 11.17 7.3376 11.3042 7.30094 11.4508L6.52344 14.56"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.1917 5.39166L15.6917 7.89166"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M9.62177 13.785C9.63344 13.6967 9.64844 13.6092 9.64844 13.5175C9.64844 12.3667 8.71594 11.4342 7.56511 11.4342C7.47344 11.4342 7.38594 11.45 7.29761 11.4609"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
