import type { ApiError } from "@repo/api/types";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/api-endpoints";
import { normalizeStrapiPostEntry, type HomeFeedPost } from "@/services/feed-post.service";
import { handleAuthErrors } from "@/utils/auth";

const POST_BOOKMARK_TIMEOUT_MS = 15000;

export type TogglePostBookmarkResult = {
  isBookmarked: boolean;
};

export type UserPostBookmarksResult = {
  data: HomeFeedPost[];
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
};

function authHeaders(): Record<string, string> | undefined {
  const accessToken =
    typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
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

function readRows(response: unknown): unknown[] {
  if (!response || typeof response !== "object") return [];
  const data = (response as Record<string, unknown>).data;
  return Array.isArray(data) ? data : [];
}

function readMeta(response: unknown): UserPostBookmarksResult["meta"] {
  if (!response || typeof response !== "object") return undefined;
  const meta = (response as Record<string, unknown>).meta;
  return meta && typeof meta === "object" ? (meta as UserPostBookmarksResult["meta"]) : undefined;
}

function readRecord(entry: unknown): Record<string, unknown> {
  if (!entry || typeof entry !== "object") return {};
  const attrs = (entry as Record<string, unknown>).attributes;
  return attrs && typeof attrs === "object"
    ? ({ ...(entry as Record<string, unknown>), ...(attrs as Record<string, unknown>) } as Record<
        string,
        unknown
      >)
    : (entry as Record<string, unknown>);
}

function bookmarkedPostId(entry: unknown): string | null {
  return relationId(readRecord(entry).post);
}

function bookmarkedPost(entry: unknown): HomeFeedPost | null {
  const post = readRecord(entry).post;
  if (!post) return null;
  return normalizeStrapiPostEntry(post);
}

export function hasAccessToken(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(window.localStorage.getItem("accessToken"))
  );
}

export async function getBookmarkedPostIds(): Promise<Set<string>> {
  try {
    const response = await apiClient.get<unknown>(ENDPOINTS.POST_BOOKMARKS.USER_BOOKMARKS, {
      headers: authHeaders(),
      cache: "no-store",
      timeout: POST_BOOKMARK_TIMEOUT_MS,
      retries: 0,
    });

    return new Set(readRows(response).map(bookmarkedPostId).filter((id): id is string => id != null));
  } catch (error: unknown) {
    handleAuthErrors(error as ApiError);
    throw error;
  }
}

export async function getUserBookmarkedPosts(page = 1, pageSize = 48): Promise<UserPostBookmarksResult> {
  try {
    const response = await apiClient.get<unknown>(ENDPOINTS.POST_BOOKMARKS.USER_BOOKMARKS, {
      headers: authHeaders(),
      params: { page, pageSize },
      cache: "no-store",
      timeout: POST_BOOKMARK_TIMEOUT_MS,
      retries: 0,
    });

    return {
      data: readRows(response).map(bookmarkedPost).filter((post): post is HomeFeedPost => post != null),
      meta: readMeta(response),
    };
  } catch (error: unknown) {
    handleAuthErrors(error as ApiError);
    throw error;
  }
}

export async function togglePostBookmark(postId: string | number): Promise<TogglePostBookmarkResult> {
  try {
    const response = await apiClient.post<unknown>(
      ENDPOINTS.POST_BOOKMARKS.TOGGLE,
      { postId },
      {
        headers: authHeaders(),
        cache: "no-store",
        timeout: POST_BOOKMARK_TIMEOUT_MS,
        retries: 0,
      },
    );

    const payload = response as unknown;
    const isBookmarked =
      payload && typeof payload === "object"
        ? (payload as Record<string, unknown>).isBookmarked
        : undefined;

    return { isBookmarked: isBookmarked === true };
  } catch (error: unknown) {
    handleAuthErrors(error as ApiError);
    throw error;
  }
}
