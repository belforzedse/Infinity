import { apiClient } from "@/services";
import { formatQueryParams } from "@/utils/api";

export interface UserActivity {
  id: number;
  ActivityType: string;
  Title: string;
  Message: string;
  Severity?: "info" | "success" | "warning" | "error";
  IsRead?: boolean;
  ResourceType?: string;
  ResourceId?: string;
  Metadata?: Record<string, any>;
  Icon?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    username?: string;
    email?: string;
    phone?: string;
  };
}

export interface UserActivityResponse {
  data: UserActivity[];
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
 * Get user activities for a specific user (superadmin only)
 */
export async function getUserActivities(
  userId: number,
  params?: { page?: number; pageSize?: number }
): Promise<UserActivityResponse> {
  const query = params ? formatQueryParams(params as any) : "";
  const res = await apiClient.get(`/user-activities/user/${userId}${query}` as any);
  return res as UserActivityResponse;
}



