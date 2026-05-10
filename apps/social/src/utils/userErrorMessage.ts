import { extractErrorMessage, translateErrorMessage } from "@/lib/errorTranslations";

const DEFAULT_MESSAGE = "متأسفانه مشکلی پیش آمد. لطفاً دوباره تلاش کنید.";

export function getUserFacingErrorMessage(error: unknown, fallback?: string): string {
  const rawMessage = extractErrorMessage(error);
  const fallbackMessage = fallback || DEFAULT_MESSAGE;
  return translateErrorMessage(rawMessage, fallbackMessage);
}
