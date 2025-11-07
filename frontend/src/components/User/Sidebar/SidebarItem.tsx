"use client";
import Link from "next/link";
import type { ReactNode} from "react";
import { cloneElement, isValidElement } from "react";
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
    const iconClassName = clsx("h-5 w-5", isActive ? "fill-white text-black" : "text-pink-500");

    if (isValidElement<{ className?: string }>(iconElement)) {
      return cloneElement(iconElement, { className: iconClassName });
    }
    return iconElement;
  };

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-2 rounded-lg px-5 py-3 text-gray-700 transition-all hover:bg-red-50 hover:text-red-600"
      >
        {renderIcon(icon)}
        <span className="text-sm">{text}</span>
      </button>
    );
  }

  return (
    <Link
      href={href}
      className={`relative flex items-center gap-2 rounded-lg px-5 py-3 transition-all ${
        isActive
          ? "justify-between border-l-4 border-pink-600 bg-pink-100"
          : "text-gray-700 hover:bg-pink-50"
      }`}
    >
      <div className="flex items-center gap-2">
        {renderIcon(icon)}
        <span
          className={`text-sm font-medium transition-colors ${
            isActive ? "text-gray-900" : "text-gray-700"
          }`}
        >
          {text}
        </span>
      </div>
      {isActive && <ArrowLeftIcon className="h-4 w-4 text-gray-900" />}
    </Link>
  );
};

export default SidebarItem;
