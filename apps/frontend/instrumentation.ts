export async function register() {
  if (process.env.E2E_DISABLE_SENTRY === "1") {
    return;
  }

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

type CaptureRequestError = typeof import("@sentry/nextjs").captureRequestError;

export const onRequestError: CaptureRequestError = async (...args) => {
  if (process.env.E2E_DISABLE_SENTRY === "1") {
    return;
  }

  const Sentry = await import("@sentry/nextjs");
  return Sentry.captureRequestError(...args);
};
