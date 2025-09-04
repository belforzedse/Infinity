"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  title: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}

const PLPFilterBox = ({ title, children, defaultOpen = false }: Props) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl bg-stone-50 p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsOpen(!isOpen)}
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
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PLPFilterBox;
