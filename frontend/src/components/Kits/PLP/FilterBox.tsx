"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const MotionDiv = dynamic(
  () => import("framer-motion").then((mod) => mod.motion.div),
  { ssr: false },
);
const AnimatePresence = dynamic(
  () => import("framer-motion").then((mod) => mod.AnimatePresence),
  { ssr: false },
);

interface Props {
  title: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}

const PLPFilterBox = ({ title, children, defaultOpen = false }: Props) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [hasAnimated, setHasAnimated] = useState(defaultOpen);

  const handleToggle = () => {
    if (!hasAnimated) {
      setHasAnimated(true);
    }
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="rounded-2xl bg-stone-50 p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={handleToggle}
          className="flex w-full flex-row-reverse items-center justify-between gap-x-[81px]"
        >
          <div
            className={`flex h-5 w-5 items-center justify-center transition-transform`}
          >
            <span className="text-primary text-2xl font-light !leading-none">
              {isOpen ? "-" : "+"}
            </span>
          </div>
          <span className="text-primary text-sm font-normal">{title}</span>
        </button>
      </div>
      {hasAnimated && (
        <AnimatePresence>
          {isOpen && (
            <MotionDiv
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 overflow-hidden"
            >
              {children}
            </MotionDiv>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default PLPFilterBox;
