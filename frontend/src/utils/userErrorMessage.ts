import { extractErrorMessage, translateErrorMessage } from "@/lib/errorTranslations";

const DEFAULT_MESSAGE = "متأسفانه مشکلی پیش آمد. لطفاً دوباره تلاش کنید.";

/**
 * Converts a caught error into a user-facing Persian message.
 * The raw message is preserved for logging, but only the translated string
 * is returned to the UI.
 */
export function getUserFacingErrorMessage(error: unknown, fallback?: string): string {
  const rawMessage = extractErrorMessage(error);
  const fallbackMessage = fallback || DEFAULT_MESSAGE;
  return translateErrorMessage(rawMessage, fallbackMessage);
}
