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
        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white lg:hidden"
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
