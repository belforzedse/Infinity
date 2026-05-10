import { atom } from "jotai";
import type { MeResponse } from "@/types/user-me";

export const currentUserAtom = atom<MeResponse | null>(null);
export const userLoadingAtom = atom<boolean>(true);
export const userErrorAtom = atom<Error | null>(null);
export const redirectUrlAtom = atom<string | null>(null);
