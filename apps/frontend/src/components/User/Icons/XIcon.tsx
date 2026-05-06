interface IconProps {
  className?: string;
}

export default function XIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.26665 12.6666L3.33331 11.7333L7.06665 7.99998L3.33331 4.26665L4.26665 3.33331L7.99998 7.06665L11.7333 3.33331L12.6666 4.26665L8.93331 7.99998L12.6666 11.7333L11.7333 12.6666L7.99998 8.93331L4.26665 12.6666Z"
        fill="#EC4899"
      />
    </svg>
  );
}
