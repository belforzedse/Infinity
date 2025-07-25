import React from "react";

interface IconProps {
  className?: string;
}

export default function TrashIcon({ className }: IconProps) {
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
        d="M14 3.98665C11.78 3.76665 9.54667 3.65332 7.32 3.65332C6 3.65332 4.68 3.71999 3.36 3.85332L2 3.98665"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.66675 3.31325L5.81341 2.43992C5.92008 1.80659 6.00008 1.33325 7.12675 1.33325H8.87341C10.0001 1.33325 10.0867 1.83325 10.1867 2.44659L10.3334 3.31325"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.5667 6.09326L12.1334 12.8066C12.06 13.8533 12 14.6666 10.1401 14.6666H5.86008C4.00008 14.6666 3.94008 13.8533 3.86675 12.8066L3.43341 6.09326"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.88672 11H9.10672"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.33325 8.33325H9.66659"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
