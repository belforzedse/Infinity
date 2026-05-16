import type { ApiError } from "@repo/api/types";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/api-endpoints";
import { handleAuthErrors } from "@/utils/auth";

const NOTIFICATION_TIMEOUT_MS = 15000;

export type NotificationKind =
  | "site_message"
  | "comment_reply"
  | "comment_approved"
  | "comment_liked";

export type AppNotification = {
  id: number;
  kind: NotificationKind;
  title: string;
  body: string;
  actorName: string;
  link: string;
  isRead: boolean;
  createdAt: string;
};

export type GetNotificationsResult = {
  data: AppNotification[];
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

function readRecord(entry: unknown): Record<string, unknown> {
  if (!entry || typeof entry !== "object") return {};
  const r = entry as Record<string, unknown>;
  const attrs = r.attributes;
  return attrs && typeof attrs === "object"
    ? { ...r, ...(attrs as Record<string, unknown>) }
    : r;
}

function readRows(response: unknown): unknown[] {
  if (!response || typeof response !== "object") return [];
  const data = (response as Record<string, unknown>).data;
  return Array.isArray(data) ? data : [];
}

function readMeta(response: unknown): GetNotificationsResult["meta"] {
  if (!response || typeof response !== "object") return undefined;
  const meta = (response as Record<string, unknown>).meta;
  return meta && typeof meta === "object" ? (meta as GetNotificationsResult["meta"]) : undefined;
}

function readUnreadCount(response: unknown): number {
  if (!response || typeof response !== "object") return 0;
  const count = Number((response as Record<string, unknown>).count);
  return Number.isFinite(count) ? count : 0;
}

export function normalizeNotification(entry: unknown): AppNotification | null {
  if (!entry || typeof entry !== "object") return null;
  const raw = entry as Record<string, unknown>;
  const id = typeof raw.id === "number" ? raw.id : Number(raw.id);
  if (!Number.isFinite(id)) return null;

  const r = readRecord(entry);

  return {
    id,
    kind: (r.Kind ?? r.kind ?? "site_message") as NotificationKind,
    title: typeof r.Title === "string" ? r.Title : typeof r.title === "string" ? r.title : "",
    body: typeof r.Body === "string" ? r.Body : typeof r.body === "string" ? r.body : "",
    actorName:
      typeof r.ActorName === "string" ? r.ActorName : typeof r.actorName === "string" ? r.actorName : "",
    link: typeof r.Link === "string" ? r.Link : typeof r.link === "string" ? r.link : "/",
    isRead:
      r.IsRead === true || r.isRead === true
        ? true
        : r.IsRead === false || r.isRead === false
          ? false
          : false,
    createdAt:
      typeof r.createdAt === "string"
        ? r.createdAt
        : typeof r.created_at === "string"
          ? r.created_at
          : "",
  };
}

export async function getMyNotifications(
  page = 1,
  pageSize = 25,
): Promise<GetNotificationsResult> {
  try {
    const response = await apiClient.get<unknown>(ENDPOINTS.NOTIFICATIONS.LIST_MINE, {
      headers: authHeaders(),
      params: { page, pageSize },
      cache: "no-store",
      timeout: NOTIFICATION_TIMEOUT_MS,
      retries: 0,
    });

    return {
      data: readRows(response)
        .map(normalizeNotification)
        .filter((n): n is AppNotification => n != null),
      meta: readMeta(response),
    };
  } catch (error: unknown) {
    handleAuthErrors(error as ApiError);
    throw error;
  }
}

export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const response = await apiClient.get<unknown>(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT, {
      headers: authHeaders(),
      cache: "no-store",
      timeout: NOTIFICATION_TIMEOUT_MS,
      retries: 0,
    });

    return readUnreadCount(response);
  } catch {
    return 0;
  }
}

export async function markNotificationRead(id: number | string): Promise<void> {
  try {
    await apiClient.post(
      ENDPOINTS.NOTIFICATIONS.MARK_READ(id),
      {},
      {
        headers: authHeaders(),
        cache: "no-store",
        timeout: NOTIFICATION_TIMEOUT_MS,
        retries: 0,
      },
    );
  } catch (error: unknown) {
    handleAuthErrors(error as ApiError);
    throw error;
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  try {
    await apiClient.post(
      ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ,
      {},
      {
        headers: authHeaders(),
        cache: "no-store",
        timeout: NOTIFICATION_TIMEOUT_MS,
        retries: 0,
      },
    );
  } catch (error: unknown) {
    handleAuthErrors(error as ApiError);
    throw error;
  }
}
