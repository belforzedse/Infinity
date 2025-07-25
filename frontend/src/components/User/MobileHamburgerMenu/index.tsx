"use client";
import { useState } from "react";
import MenuIcon from "../Icons/MenuIcon";
import Menu from "./Menu";

const MobileHamburgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button
        className="rounded-full w-10 h-10 bg-white border border-slate-200 lg:hidden flex items-center justify-center"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
      >
        <MenuIcon />
      </button>

      <Menu isOpen={isOpen} onClose={handleClose} />
    </>
  );
};

export default MobileHamburgerMenu;
