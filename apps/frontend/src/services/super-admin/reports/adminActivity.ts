import { apiClient } from "@/services";
import { formatQueryParams } from "@/utils/api";

export interface AdminActivityLog {
  id: number;
  ResourceType: "Order" | "Product" | "User" | "Contract" | "Discount" | "Stock" | "Other";
  Action:
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
  Title?: string;
  Message?: string;
  MessageEn?: string;
  Severity?: "info" | "success" | "warning" | "error";
  Changes?: Record<string, { from?: any; to?: any }>;
  PerformedByName?: string;
  PerformedByRole?: string;
  Description?: string;
  Metadata?: Record<string, any>;
  IP?: string;
  UserAgent?: string;
  ResourceId?: string;
  createdAt: string;
  updatedAt: string;
  adminRole?: string;
  timestamp?: string;
  adminUsername?: string;
  performed_by?: {
    id: number;
    username?: string;
    email?: string;
    phone?: string;
  };
}

export interface AdminActivityAdmin {
  id: number | null;
  name: string;
  role: string | null;
}

export interface AdminActivityResponse {
  data: AdminActivityLog[];
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
    admins?: AdminActivityAdmin[];
  };
}

/**
 * Get admin activity report with filters
 */
export async function getAdminActivity(params: {
  startDate?: string;
  endDate?: string;
  performedBy?: string | number;
  logType?: string;
  actionType?: string;
  page?: number;
  pageSize?: number;
}): Promise<AdminActivityResponse> {
  const query = formatQueryParams({
    startDate: params.startDate,
    endDate: params.endDate,
    performedBy: params.performedBy,
    log_type: params.logType,
    action_type: params.actionType,
    page: params.page,
    pageSize: params.pageSize,
  });
  const res = await apiClient.get(`/reports/admin-activity${query}` as any);
  const responseData = (res as any)?.data || [];
  const pagination = (res as any)?.meta?.pagination || undefined;
  const admins = (res as any)?.meta?.admins || undefined;
  return {
    data: responseData,
    meta:
      pagination || admins
        ? {
            pagination,
            admins,
          }
        : undefined,
  };
}

/**
 * Get a single admin activity (audit log entry) by ID.
 */
export async function getAdminActivityById(id: number): Promise<AdminActivityLog> {
  const res = await apiClient.get(`/reports/admin-activity/${id}` as any);
  return (res as any).data as AdminActivityLog;
}
