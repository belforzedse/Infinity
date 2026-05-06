import type { MeResponse } from "@/services/user/me";

/**
 * Returns true if the user's profile is missing required display fields (first and last name).
 * Used to redirect users to complete their profile after login.
 */
export function isProfileIncomplete(user: MeResponse): boolean {
  const first = typeof user.FirstName === "string" ? user.FirstName.trim() : "";
  const last = typeof user.LastName === "string" ? user.LastName.trim() : "";
  return first.length === 0 || last.length === 0;
}
