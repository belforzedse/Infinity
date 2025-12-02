"use client";

import { useState, useEffect, useCallback } from "react";

interface UseCountdownReturn {
  timeLeft: string;
  isActive: boolean;
  startTimer: () => void;
  resetTimer: () => void;
}

export function useCountdown(initialSeconds: number = 120): UseCountdownReturn {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true); // Start active by default

  const startTimer = useCallback(() => {
    setIsActive(true);
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);
    } else if (seconds === 0) {
      setIsActive(false);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, seconds]);

  // Format seconds to MM:SS with Persian numbers
  const timeLeft = `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`.replace(
    /[0-9]/g,
    (d) => ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"][Number(d)],
  );

  return {
    timeLeft,
    isActive,
    startTimer,
    resetTimer,
  };
}
