import { atomWithStorage } from "jotai/utils";

export const savedPostIdsAtom = atomWithStorage<string[]>("social:saved-post-ids", []);
