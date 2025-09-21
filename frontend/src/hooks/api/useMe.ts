"use client";

import { atom, useAtom } from "jotai";
import { useEffect, useState } from "react";
import UserService from "@/services/user";
import type { MeResponse } from "@/services/user/me";

const meAtom = atom<MeResponse | null>(null);

export const useMe = () => {
  const [data, setData] = useAtom(meAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (data) return;

    setIsLoading(true);
    setError(null);
    UserService.me()
      .then((response) => {
        setData(response);
      })
      .catch((err: unknown) => {
        if (err instanceof Error) {
          setError(err);
        } else if (err && typeof err === "object" && "message" in err) {
          const message = (err as { message?: string }).message;
          setError(new Error(message || "Failed to fetch user"));
        } else {
          setError(new Error("Failed to fetch user"));
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [data, setData]);

  return { data, isLoading, error };
};
