/**
 * fetchWithTimeout
 * A small wrapper for server-side fetch to ensure we never hang indefinitely.
 */

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<Response> {
  const { timeoutMs = 15000, ...rest } = init;

  // AbortController is available in Node 18+ (Next runtime)
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(input, { ...rest, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export default fetchWithTimeout;
