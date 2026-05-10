import type { MeResponse } from "@/types/user-me";

export function isProfileIncomplete(user: MeResponse): boolean {
  const first = typeof user.FirstName === "string" ? user.FirstName.trim() : "";
  const last = typeof user.LastName === "string" ? user.LastName.trim() : "";
  return first.length === 0 || last.length === 0;
}
