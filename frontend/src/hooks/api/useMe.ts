"use client";

import { atom, useAtom } from "jotai";
import { useEffect, useState } from "react";
import UserService from "@/services/user";
import { MeResponse } from "@/services/user/me";

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
      .catch((err) => {
        setError(err instanceof Error ? err : new Error("Failed to fetch user"));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [data]);

  return { data, isLoading, error };
};
