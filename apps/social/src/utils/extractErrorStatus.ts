/** HTTP status from `@repo/api` ApiError or legacy nested `response.status`. */
export function extractErrorStatus(error: unknown): number {
  if (typeof error === "object" && error !== null) {
    const obj = error as Record<string, unknown>;

    if (typeof obj.status === "number") {
      return obj.status;
    }

    if (typeof obj.response === "object" && obj.response !== null) {
      const respObj = obj.response as Record<string, unknown>;
      if (typeof respObj.status === "number") {
        return respObj.status;
      }
    }
  }

  return 0;
}
