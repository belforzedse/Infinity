import { createStore } from "jotai/vanilla";

// Single shared Jotai store used across app and non-React modules
export const jotaiStore = createStore();

export default jotaiStore;

