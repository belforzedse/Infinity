"use client";

import { useEffect } from "react";
import { useAtom } from "jotai";
import { errorNotificationsAtom } from "@/lib/atoms/errors";
import { ErrorNotification } from "./ErrorNotification";

/**
 * Displays all active error notifications
 * Auto-removes notifications after 5 seconds
 * Place in root layout/providers so errors show globally
 */
export default function GlobalErrorDisplay() {
  const [errors, setErrors] = useAtom(errorNotificationsAtom);

  useEffect(() => {
    if (errors.length === 0) return;

    const timers = errors.map((error) => {
      return setTimeout(() => {
        setErrors((prev) => prev.filter((e) => e.id !== error.id));
      }, 5000); // Auto-remove after 5 seconds
    });

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [errors, setErrors]);

  return (
    <>
      {errors.map((error) => (
        <ErrorNotification
          key={error.id}
          status={error.status}
          message={error.message}
          onDismiss={() => {
            setErrors((prev) => prev.filter((e) => e.id !== error.id));
          }}
        />
      ))}
    </>
  );
}
