import type { ApiError } from "@repo/api/types";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/api-endpoints";
import { handleAuthErrors } from "@/utils/auth";
import { IMAGE_BASE_URL } from "@repo/api";

const COMMENT_TIMEOUT_MS = 15000;

function authHeaders(): Record<string, string> | undefined {
  const accessToken =
    typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
}

export type PendingPostComment = {
  id: number;
  content: string;
  name: string;
  date: string;
  status: "Pending" | "Approved" | "Rejected";
  post: {
    id: number;
    title: string;
    coverUrl: string | null;
  } | null;
};

export type CreatedPostComment = {
  id: string;
  content: string;
  date: string;
  status: "Pending" | "Approved" | "Rejected";
  isInfinity: boolean;
  parentCommentId: string | null;
};

type MaybeWrapped<T> = T | { data: T };

function unwrap<T>(value: unknown): T {
  const v = value as MaybeWrapped<T>;
  if (typeof v === "object" && v !== null && "data" in (v as Record<string, unknown>)) {
    const inner = (v as { data: unknown }).data;
    if (inner !== undefined) return inner as T;
  }
  return value as T;
}

function readAttrs(entry: unknown): Record<string, unknown> {
  if (!entry || typeof entry !== "object") return {};
  const r = entry as Record<string, unknown>;
  const inner = r.attributes;
  if (inner && typeof inner === "object") return inner as Record<string, unknown>;
  return r;
}

function strapiMediaUrl(relativeOrAbsolute: string | undefined): string | null {
  if (!relativeOrAbsolute?.trim()) return null;
  const u = relativeOrAbsolute.trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  const base = IMAGE_BASE_URL.replace(/\/$/, "");
  return `${base}${u.startsWith("/") ? u : `/${u}`}`;
}

function relationEntry(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  return r.data ?? raw;
}

function relationId(raw: unknown): string | null {
  const entry = relationEntry(raw);
  if (!entry || typeof entry !== "object") return null;
  const id = (entry as Record<string, unknown>).id;
  return typeof id === "number" || typeof id === "string" ? String(id) : null;
}

function normalizePendingComment(entry: unknown): PendingPostComment | null {
  if (!entry || typeof entry !== "object") return null;
  const root = entry as Record<string, unknown>;
  const id = typeof root.id === "number" ? root.id : Number(root.id);
  const attrs = readAttrs(entry);
  if (!Number.isFinite(id)) return null;

  const postEntry = relationEntry(attrs.post);
  const postAttrs = readAttrs(postEntry);
  const rawPostId =
    postEntry && typeof postEntry === "object" ? (postEntry as Record<string, unknown>).id : undefined;
  const postId = typeof rawPostId === "number" ? rawPostId : Number(rawPostId);

  const coverEntry = relationEntry(postAttrs.CoverImage);
  const coverAttrs = readAttrs(coverEntry);
  const coverUrl = strapiMediaUrl(typeof coverAttrs.url === "string" ? coverAttrs.url : undefined);

  const status = attrs.Status;
  const normalizedStatus =
    status === "Approved" || status === "Rejected" || status === "Pending" ? status : "Pending";

  return {
    id,
    content: typeof attrs.Content === "string" ? attrs.Content : "",
    name: typeof attrs.Name === "string" && attrs.Name.trim() ? attrs.Name : "کاربر",
    date:
      typeof attrs.Date === "string"
        ? attrs.Date
        : typeof attrs.createdAt === "string"
          ? attrs.createdAt
          : "",
    status: normalizedStatus,
    post: Number.isFinite(postId)
      ? {
          id: postId,
          title: typeof postAttrs.Title === "string" ? postAttrs.Title : "پست",
          coverUrl,
        }
      : null,
  };
}

function normalizeCreatedComment(entry: unknown): CreatedPostComment | null {
  if (!entry || typeof entry !== "object") return null;
  const root = entry as Record<string, unknown>;
  const attrs = readAttrs(entry);
  const id = root.id ?? attrs.id;
  if (typeof id !== "number" && typeof id !== "string") return null;

  const status = attrs.Status;
  const normalizedStatus =
    status === "Approved" || status === "Rejected" || status === "Pending" ? status : "Pending";

  return {
    id: String(id),
    content: typeof attrs.Content === "string" ? attrs.Content : "",
    date:
      typeof attrs.Date === "string"
        ? attrs.Date
        : typeof attrs.createdAt === "string"
          ? attrs.createdAt
          : new Date().toISOString(),
    status: normalizedStatus,
    isInfinity: attrs.IsInfinity === true,
    parentCommentId: relationId(attrs.parent_comment),
  };
}

export async function createPostComment(input: {
  postId: string | number;
  content: string;
  parentCommentId?: string | number;
}): Promise<CreatedPostComment> {
  try {
    const response = await apiClient.post<unknown>(
      ENDPOINTS.POST_COMMENTS.CREATE,
      {
        data: {
          Content: input.content,
          post: input.postId,
          ...(input.parentCommentId ? { parent_comment: input.parentCommentId } : {}),
        },
      },
      {
        headers: authHeaders(),
        cache: "no-store",
        timeout: COMMENT_TIMEOUT_MS,
        retries: 0,
      },
    );
    const created = normalizeCreatedComment(unwrap<unknown>(response));
    if (!created) {
      throw new Error("Invalid comment response");
    }
    return created;
  } catch (error: unknown) {
    handleAuthErrors(error as ApiError);
    throw error;
  }
}

export async function listPendingPostComments(): Promise<PendingPostComment[]> {
  try {
    const response = await apiClient.get<unknown>(ENDPOINTS.POST_COMMENTS.LIST, {
      headers: authHeaders(),
      params: {
        "filters[Status][$eq]": "Pending",
        "populate[post][populate][CoverImage][fields][0]": "url",
        "populate[post][fields][0]": "Title",
        "sort[0]": "createdAt:desc",
        "pagination[pageSize]": 100,
      },
      cache: "no-store",
      timeout: COMMENT_TIMEOUT_MS,
      retries: 0,
    });
    const rows = unwrap<unknown[]>(response);
    return Array.isArray(rows)
      ? rows.map(normalizePendingComment).filter((row): row is PendingPostComment => row != null)
      : [];
  } catch (error: unknown) {
    handleAuthErrors(error as ApiError);
    throw error;
  }
}

export async function approvePostComment(id: number | string): Promise<void> {
  try {
    await apiClient.put(
      ENDPOINTS.POST_COMMENTS.APPROVE(id),
      {},
      {
        headers: authHeaders(),
        cache: "no-store",
        timeout: COMMENT_TIMEOUT_MS,
        retries: 0,
      },
    );
  } catch (error: unknown) {
    handleAuthErrors(error as ApiError);
    throw error;
  }
}

export async function rejectPostComment(id: number | string): Promise<void> {
  try {
    await apiClient.put(
      ENDPOINTS.POST_COMMENTS.REJECT(id),
      {},
      {
        headers: authHeaders(),
        cache: "no-store",
        timeout: COMMENT_TIMEOUT_MS,
        retries: 0,
      },
    );
  } catch (error: unknown) {
    handleAuthErrors(error as ApiError);
    throw error;
  }
}
