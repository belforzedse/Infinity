const CheckIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M0.400024 0.400024H11.6V11.6H0.400024V0.400024Z" fill="#EC4899" />
      <path d="M9.73339 3.43335L4.60006 8.56668L2.26672 6.23335" fill="#EC4899" />
      <path
        d="M9.73339 3.43335L4.60006 8.56668L2.26672 6.23335"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default CheckIcon;
