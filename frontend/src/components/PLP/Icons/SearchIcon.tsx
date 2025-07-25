import { SVGProps } from "react";

export default function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M11.7647 11.7647L14.6667 14.6667"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.33333 12.0833C10.3584 12.0833 11.9999 10.4417 11.9999 8.41667C11.9999 6.39162 10.3584 4.75 8.33333 4.75C6.30828 4.75 4.66666 6.39162 4.66666 8.41667C4.66666 10.4417 6.30828 12.0833 8.33333 12.0833Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
