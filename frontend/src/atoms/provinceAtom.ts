import { atom } from "jotai";

// Atom to track the selected province
export const selectedProvinceAtom = atom<string | null>(null);
