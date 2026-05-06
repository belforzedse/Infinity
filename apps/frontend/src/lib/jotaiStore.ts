import { createStore } from "jotai/vanilla";

/**
 * Single shared Jotai store instance used across the app and in non-React
 * modules. Creating one store prevents multiple, isolated state containers and
 * allows utilities outside of React components to interact with the same state
 * tree.
 */
export const jotaiStore = createStore();

export default jotaiStore;
