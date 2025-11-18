import { apiClient } from "@/services";
import { formatQueryParams } from "@/utils/api";

export interface AdminActivityLog {
  id: string;
  logType: "Order" | "Product" | "User" | "Contract" | "Discount" | "Stock" | "Admin" | "Other";
  actionType: "Create" | "Update" | "Delete" | "Publish" | "Unpublish" | "Adjust" | "Other";
  adminUsername: string;
  adminRole: string;
  description: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface AdminActivityResponse {
  activities: AdminActivityLog[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export async function getAdminActivity(params: {
  start?: string;
  end?: string;
  user_id?: string;
  action_type?: "Create" | "Update" | "Delete" | "Publish" | "Unpublish" | "Adjust" | "Other";
  log_type?: "All" | "Order" | "Product" | "User" | "Contract" | "Discount" | "Stock" | "Admin" | "Other";
  limit?: number;
  offset?: number;
}) {
  const query = formatQueryParams(params as any);
  const res = await apiClient.get(`/reports/admin-activity${query}`);
  return (res as any).data as AdminActivityResponse;
}
