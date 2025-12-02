export default function ChevronRightIcon(props: { color?: string }) {
  const { color = "#DB2777" } = props;

  return (
    <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10.4751 8.51501L14.4751 12.515L10.4751 16.515"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
