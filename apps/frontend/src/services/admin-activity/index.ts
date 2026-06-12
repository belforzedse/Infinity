import { apiClient } from "../index";

/**
 * Admin Activity (canonical admin audit log) types.
 * Mirrors `api::manual-admin-activity.manual-admin-activity` on the backend.
 */

export type AdminActivityAction =
  | "Create"
  | "Update"
  | "Delete"
  | "Publish"
  | "Unpublish"
  | "Adjust"
  | "Import"
  | "Refund"
  | "StatusChange"
  | "Other";

export type AdminActivitySeverity = "info" | "success" | "warning" | "error";

/** A single before/after change for one field. */
export interface AdminActivityChange {
  from?: unknown;
  to?: unknown;
}

export interface AdminActivity {
  id: number;
  ResourceType: string;
  ResourceId?: string;
  Action: AdminActivityAction;
  Title?: string;
  Message?: string;
  MessageEn?: string;
  Severity?: AdminActivitySeverity;
  /** Normalized field diff: `{ FieldName: { from, to } }`. */
  Changes?: Record<string, AdminActivityChange> | null;
  Description?: string;
  Metadata?: Record<string, unknown> | null;
  PerformedByName?: string;
  PerformedByRole?: string;
  performed_by?: {
    id: number;
    username?: string;
    email?: string;
  } | null;
  createdAt: string;
}

export interface AdminActivityResponse {
  data: AdminActivity[];
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface AdminActivityQueryParams {
  page?: number;
  pageSize?: number;
}

/**
 * Fetch the admin activity feed for a specific order (super-admin only on the backend).
 * Backend response shape: `{ data: AdminActivity[], meta: { pagination } }`.
 */
export async function getOrderAdminActivities(
  orderId: string | number,
  params?: AdminActivityQueryParams,
): Promise<AdminActivityResponse> {
  if (!orderId) {
    throw new Error("orderId is required");
  }

  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", String(params.page));
  if (params?.pageSize) queryParams.append("pageSize", String(params.pageSize));

  const queryString = queryParams.toString();
  const url = `/admin-activities/order/${orderId}${queryString ? `?${queryString}` : ""}`;

  // `apiClient.get<T>` resolves to the raw JSON body typed as `{ data: T, meta? }`.
  // Our backend body is already `{ data: AdminActivity[], meta }`, so `res.data` is the array.
  const res = await apiClient.get<AdminActivity[]>(url);
  return {
    data: (res?.data as AdminActivity[]) ?? [],
    meta: (res as { meta?: AdminActivityResponse["meta"] })?.meta,
  };
}

const AdminActivityService = {
  getOrderAdminActivities,
};

export default AdminActivityService;
