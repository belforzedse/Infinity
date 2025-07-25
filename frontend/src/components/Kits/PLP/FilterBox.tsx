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
    <div className="bg-stone-50 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex flex-row-reverse items-center gap-x-[81px] w-full justify-between"
        >
          <div
            className={`w-5 h-5 flex items-center justify-center transition-transform`}
          >
            <span className="text-2xl !leading-none text-primary font-light">
              {isOpen ? "-" : "+"}
            </span>
          </div>
          <span className="text-sm font-normal text-primary">{title}</span>
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
