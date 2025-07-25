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
      "w-5 h-5",
      isActive ? "text-white fill-white" : "text-pink-500"
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
        className="flex items-center gap-2 py-4 px-5 text-gray-700"
      >
        {renderIcon(icon)}
        <span className="text-base">{text}</span>
      </button>
    );
  }

  return (
    <Link
      href={href}
      className={`flex items-center gap-2 py-4 px-5 relative ${
        isActive
          ? "justify-between gap-2 bg-background-pink text-white rounded-lg"
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
          <div className="bg-background-pink w-1 rounded-full h-14 absolute right-[-32px] top-0" />
        </>
      )}
    </Link>
  );
};

export default SidebarItem;
