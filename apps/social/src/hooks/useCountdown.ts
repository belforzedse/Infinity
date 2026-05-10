"use client";

import { useState, useEffect, useCallback } from "react";

interface UseCountdownReturn {
  timeLeft: string;
  /** True while countdown is running (seconds &gt; 0). */
  isActive: boolean;
  startTimer: () => void;
  resetTimer: () => void;
}

export function useCountdown(initialSeconds: number = 120): UseCountdownReturn {
  const [seconds, setSeconds] = useState(initialSeconds);

  const startTimer = useCallback(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  const resetTimer = useCallback(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  const hasTimeLeft = seconds > 0;

  useEffect(() => {
    if (!hasTimeLeft) return undefined;
    const id = window.setInterval(() => {
      setSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [hasTimeLeft]);

  const timeLeft = `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`.replace(
    /[0-9]/g,
    (d) => ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"][Number(d)],
  );

  return {
    timeLeft,
    isActive: hasTimeLeft,
    startTimer,
    resetTimer,
  };
}
