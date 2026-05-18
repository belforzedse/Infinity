"use client";

import { useEffect, useState } from "react";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof window === "undefined" ? true : window.navigator.onLine,
  );
  const [hasRecovered, setHasRecovered] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onOnline = () => {
      setIsOnline(true);
      setHasRecovered(true);
      window.setTimeout(() => setHasRecovered(false), 3000);
    };
    const onOffline = () => setIsOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return { isOnline, hasRecovered };
}
