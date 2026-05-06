import { SubmitOrderStep } from "@/types/Order";
import { atom } from "jotai";

// Atom to track the selected province
export const submitOrderStepAtom = atom<SubmitOrderStep>(SubmitOrderStep.Table);

export const orderIdAtom = atom<number | null>(null);
export const orderNumberAtom = atom<string | null>(null);
export const transactionIdAtom = atom<string | null>(null);
