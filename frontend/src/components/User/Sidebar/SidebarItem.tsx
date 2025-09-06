"use client";
import Link from "next/link";
import { ReactNode, cloneElement, isValidElement } from "react";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import ArrowLeftIcon from "../Icons/ArrowLeftIcon";

interface SidebarItemProps {
  href: string;
  icon: React.ReactElement<{ className?: string }>;
  text: string;
  onClick?: () => void;
}

const SidebarItem = ({ href, icon, text, onClick }: SidebarItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  const renderIcon = (iconElement: ReactNode) => {
    const iconClassName = clsx(
      "h-5 w-5",
      isActive ? "text-white fill-white" : "text-pink-500",
    );

    if (isValidElement<{ className?: string }>(iconElement)) {
      return cloneElement(iconElement, { className: iconClassName });
    }
    return iconElement;
  };

  if (onClick) {
    return (
      <button
        // onClick={onClick}
        className="flex items-center gap-2 px-5 py-4 text-gray-700"
      >
        {renderIcon(icon)}
        <span className="text-base">{text}</span>
      </button>
    );
  }

  return (
    <Link
      href={href}
      className={`relative flex items-center gap-2 px-5 py-4 ${
        isActive
          ? "justify-between gap-2 rounded-lg bg-background-pink text-white"
          : "text-gray-700 hover:text-pink-500"
      }`}
    >
      <div className="flex items-center gap-2">
        {renderIcon(icon)}
        <span className="text-sm">{text}</span>
      </div>
      {isActive && (
        <>
          <ArrowLeftIcon />
          <div className="absolute top-0 right-[-32px] h-14 w-1 rounded-full bg-background-pink" />
        </>
      )}
    </Link>
  );
};

export default SidebarItem;
