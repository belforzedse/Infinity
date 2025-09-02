"use client";

import RightArrowIcon from "./User/Icons/RightArrowIcon";
import Link from "next/link";

interface Props {
  isResponsive?: boolean;
}

export default function BackButtonToStore({ isResponsive = true }: Props) {
  const buttonClasses = isResponsive
    ? "bg-background-pink text-white flex lg:flex-row flex-row-reverse items-center gap-1 py-2 lg:px-6 px-2 rounded-lg"
    : "bg-background-pink text-white flex flex-row items-center gap-1 py-2 lg:px-6 px-2 rounded-lg";

  return (
    <Link href="/" className={buttonClasses}>
      <RightArrowIcon
        className={isResponsive ? "lg:rotate-0 rotate-180" : "rotate-0"}
      />
      <span className="text-sm">
        {isResponsive ? (
          <>
            <span className="lg:inline hidden">بازگشت به</span> فروشگاه
          </>
        ) : (
          "بازگشت به فروشگاه"
        )}
      </span>
    </Link>
  );
}
     