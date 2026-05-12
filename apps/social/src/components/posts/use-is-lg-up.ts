"use client";

import { useEffect, useState } from "react";

const LG_MEDIA_QUERY = "(min-width: 1024px)";

export function useIsLgUp(): boolean {
  const [isLgUp, setIsLgUp] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mql = window.matchMedia(LG_MEDIA_QUERY);
    const apply = () => setIsLgUp(mql.matches);
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);

  return isLgUp;
}
