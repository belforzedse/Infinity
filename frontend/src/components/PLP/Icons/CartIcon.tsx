import { SVGProps } from "react";

export default function CartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="25"
      viewBox="0 0 24 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.40902 14.746L5.87402 7.5H18.5C19.151 7.5 19.628 8.111 19.47 8.743L18.122 14.135C17.917 14.954 17.221 15.556 16.381 15.64L9.56502 16.322C8.54902 16.423 7.62002 15.744 7.40902 14.746Z"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.874 7.5L5.224 4.5H3.5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.1091 19.7671C16.9071 19.7671 16.7431 19.9311 16.7451 20.1331C16.7451 20.3351 16.9091 20.4991 17.1111 20.4991C17.3131 20.4991 17.4771 20.3351 17.4771 20.1331C17.4761 19.9311 17.3121 19.7671 17.1091 19.7671"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.697 19.767C8.495 19.767 8.331 19.931 8.333 20.133C8.331 20.336 8.496 20.5 8.698 20.5C8.9 20.5 9.064 20.336 9.064 20.134C9.064 19.931 8.9 19.767 8.697 19.767"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
