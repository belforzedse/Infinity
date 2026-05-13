import type { ApiError } from "@repo/api/types";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/api-endpoints";
import { handleAuthErrors } from "@/utils/auth";

const COMMENT_LIKE_TIMEOUT_MS = 15000;

export type TogglePostCommentLikeResult = {
  isLiked: boolean;
};

function authHeaders(): Record<string, string> | undefined {
  const accessToken =
    typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
}

export function hasAccessToken(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(window.localStorage.getItem("accessToken"))
  );
}

function relationId(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw === "number" || typeof raw === "string") return String(raw);
  if (typeof raw !== "object") return null;

  const r = raw as Record<string, unknown>;
  if (r.data != null) return relationId(r.data);
  if (r.id != null) return relationId(r.id);

  return null;
}

function likedCommentId(entry: unknown): string | null {
  if (!entry || typeof entry !== "object") return null;
  const attrs = (entry as Record<string, unknown>).attributes;
  const record =
    attrs && typeof attrs === "object"
      ? ({ ...(entry as Record<string, unknown>), ...(attrs as Record<string, unknown>) } as Record<
          string,
          unknown
        >)
      : (entry as Record<string, unknown>);

  return relationId(record.post_comment);
}

function readRows(response: unknown): unknown[] {
  if (!response || typeof response !== "object") return [];
  const data = (response as Record<string, unknown>).data;
  return Array.isArray(data) ? data : [];
}

export async function getLikedPostCommentIds(): Promise<Set<string>> {
  try {
    const response = await apiClient.get<unknown>(ENDPOINTS.POST_COMMENT_LIKES.USER_LIKES, {
      headers: authHeaders(),
      cache: "no-store",
      timeout: COMMENT_LIKE_TIMEOUT_MS,
      retries: 0,
    });

    return new Set(readRows(response).map(likedCommentId).filter((id): id is string => id != null));
  } catch (error: unknown) {
    handleAuthErrors(error as ApiError);
    throw error;
  }
}

export async function togglePostCommentLike(
  commentId: string | number,
): Promise<TogglePostCommentLikeResult> {
  try {
    const response = await apiClient.post<unknown>(
      ENDPOINTS.POST_COMMENT_LIKES.TOGGLE,
      { commentId },
      {
        headers: authHeaders(),
        cache: "no-store",
        timeout: COMMENT_LIKE_TIMEOUT_MS,
        retries: 0,
      },
    );

    const payload = response as unknown;
    const isLiked =
      payload && typeof payload === "object"
        ? (payload as Record<string, unknown>).isLiked
        : undefined;

    return { isLiked: isLiked === true };
  } catch (error: unknown) {
    handleAuthErrors(error as ApiError);
    throw error;
  }
}
