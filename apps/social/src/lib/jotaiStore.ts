import { createStore } from "jotai/vanilla";

/** Shared Jotai store for auth state and hooks that set atoms outside React. */
export const jotaiStore = createStore();
