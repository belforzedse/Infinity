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
  tone?: "default" | "logout";
}

const SidebarItem = ({ href, icon, text, onClick, tone = "default" }: SidebarItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  const isLogout = tone === "logout";

  const renderIcon = (iconElement: ReactNode) => {
    const iconClassName = clsx(
      "h-5 w-5 shrink-0 transition-colors",
      isActive ? "text-white" : "text-[#EC4899]",
      isLogout && "text-[#EC4899]",
    );

    if (isValidElement<{ className?: string }>(iconElement)) {
      return cloneElement(iconElement, { className: iconClassName });
    }
    return iconElement;
  };

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-right text-[14px] font-medium text-slate-600 transition-colors hover:text-pink-600"
      >
        {renderIcon(icon)}
        <span>{text}</span>
      </button>
    );
  }

  return (
    <Link
      href={href}
      className={`relative flex items-center justify-between rounded-lg px-4 py-3 transition-colors ${
        isActive
          ? "bg-[#EC4899] text-white"
          : "text-slate-600 hover:text-[#EC4899]"
      }`}
    >
      <div className="flex items-center gap-2">
        {renderIcon(icon)}
        <span
          className={`text-[14px] font-medium transition-colors ${
            isActive ? "text-white" : "text-slate-600"
          }`}
        >
          {text}
        </span>
      </div>
      {isActive && <ArrowLeftIcon className="h-4 w-4 text-white" />}
      {isActive && <span className="absolute -right-2 top-1/2 h-12 w-1 -translate-y-1/2 rounded-full bg-[#EC4899]" />}
    </Link>
  );
};

export default SidebarItem;
