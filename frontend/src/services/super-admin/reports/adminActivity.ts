import { apiClient } from "@/services";
import { formatQueryParams } from "@/utils/api";

export interface AdminActivityLog {
  id: number;
  ResourceType: "Order" | "Product" | "User" | "Contract" | "Discount" | "Stock" | "Other";
  Action: "Create" | "Update" | "Delete" | "Publish" | "Unpublish" | "Adjust" | "Other";
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
  performed_by?: {
    id: number;
    username?: string;
    email?: string;
    phone?: string;
  };
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
  };
}

/**
 * Get admin activity report with filters
 */
export async function getAdminActivity(params: {
  startDate?: string;
  endDate?: string;
  performedBy?: string | number;
  resourceType?: string;
  page?: number;
  pageSize?: number;
}): Promise<AdminActivityResponse> {
  const query = params ? formatQueryParams(params as any) : "";
  const res = await apiClient.get(`/admin-activities/report${query}` as any);
  return res as AdminActivityResponse;
}

/**
 * Get admin activity by ID
 */
export async function getAdminActivityById(id: number): Promise<AdminActivityLog> {
  const res = await apiClient.get(`/admin-activities/${id}` as any);
  return (res as any).data as AdminActivityLog;
}

/**
 * Get admin activities for a specific order
 */
export async function getOrderAdminActivities(
  orderId: number,
  params?: { page?: number; pageSize?: number }
): Promise<AdminActivityResponse> {
  const query = params ? formatQueryParams(params as any) : "";
  const res = await apiClient.get(`/admin-activities/order/${orderId}${query}` as any);
  return res as AdminActivityResponse;
}

/**
 * Get admin activities for a specific user
 */
export async function getUserAdminActivities(
  userId: number,
  params?: { page?: number; pageSize?: number }
): Promise<AdminActivityResponse> {
  const query = params ? formatQueryParams(params as any) : "";
  const res = await apiClient.get(`/admin-activities/user/${userId}${query}` as any);
  return res as AdminActivityResponse;
}

/**
 * Get admin activities for a specific product
 */
export async function getProductAdminActivities(
  productId: number,
  params?: { page?: number; pageSize?: number }
): Promise<AdminActivityResponse> {
  const query = params ? formatQueryParams(params as any) : "";
  const res = await apiClient.get(`/admin-activities/product/${productId}${query}` as any);
  return res as AdminActivityResponse;
}
