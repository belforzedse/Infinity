"use client";

import { atom, useAtom } from "jotai";
import { useEffect, useState } from "react";
import UserService from "@/services/user";
import { MeResponse } from "@/services/user/me";

const meAtom = atom<MeResponse | null>(null);

export const useMe = () => {
  const [data, setData] = useAtom(meAtom);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (data) return;

    setIsLoading(true);
    UserService.me()
      .then((response) => {
        setData(response);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [data]);

  return { data, isLoading };
};
