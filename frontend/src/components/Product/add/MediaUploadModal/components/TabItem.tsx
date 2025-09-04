import { ReactNode } from "react";
import classNames from "classnames";
import ChevronLeftIcon from "@/components/Product/Icons/ChevronLeftIcon";

interface TabItemProps {
  isActive: boolean;
  onClick: () => void;
  children: ReactNode;
}

export default function TabItem({ isActive, onClick, children }: TabItemProps) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        "relative flex w-full items-center justify-between rounded-lg bg-white px-3 py-1.5 text-right transition-colors",
        isActive ? "text-pink-500" : "text-gray-600 hover:text-gray-800",
      )}
    >
      <span className="text-base">{children}</span>
      <ChevronLeftIcon className="h-6 w-6" />
    </button>
  );
}
