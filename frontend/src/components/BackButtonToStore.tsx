"use client";

import RightArrowIcon from "./User/Icons/RightArrowIcon";
import Link from "next/link";

/**
 * Props for {@link BackButtonToStore}.
 *
 * @property isResponsive - When true (default) the button adapts its layout
 * based on viewport width. In desktop view the arrow appears on the right,
 * whereas in mobile view it flips to the left.
 */
interface Props {
  isResponsive?: boolean;
}

/**
 * Simple navigational component that links the user back to the storefront
 * homepage. The button optionally adapts its layout responsively.
 */
export default function BackButtonToStore({ isResponsive = true }: Props) {
  const buttonClasses = isResponsive
    ? "bg-background-pink text-white flex lg:flex-row flex-row-reverse items-center gap-1 py-2 lg:px-6 px-2 rounded-lg"
    : "bg-background-pink text-white flex flex-row items-center gap-1 py-2 lg:px-6 px-2 rounded-lg";

  return (
    <Link href="/" className={buttonClasses}>
      <RightArrowIcon className={isResponsive ? "rotate-180 lg:rotate-0" : "rotate-0"} />
      <span className="text-sm">
        {isResponsive ? (
          <>
            <span className="hidden lg:inline">بازگشت به</span> فروشگاه
          </>
        ) : (
          "بازگشت به فروشگاه"
        )}
      </span>
    </Link>
  );
}
