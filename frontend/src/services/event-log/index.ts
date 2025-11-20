import { apiClient } from "../index";

/**
 * Event Log Types
 */

export type EventType = "Order" | "Payment" | "User" | "Product" | "Cart" | "Wallet" | "Shipping" | "Admin" | "System";
export type EventCategory = "StatusChange" | "Action" | "Notification" | "Error" | "Info";
export type Severity = "info" | "success" | "warning" | "error";
export type Audience = "user" | "admin" | "superadmin" | "all";

export interface EventLog {
  id: number;
  EventType: EventType;
  EventCategory: EventCategory;
  Severity: Severity;
  Message: string;
  MessageEn?: string;
  Audience: Audience;
  ResourceType?: string;
  ResourceId?: string;
  RelatedUserId?: number;
  Metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  performed_by?: {
    id: number;
    username?: string;
    email?: string;
  };
}

export interface EventLogFilters {
  eventType?: EventType;
  audience?: Audience;
  severity?: Severity;
  resourceType?: string;
  resourceId?: string | number;
  relatedUserId?: number;
  startDate?: string;
  endDate?: string;
}

export interface EventLogQueryParams {
  page?: number;
  pageSize?: number;
  sort?: string | string[];
  [key: string]: unknown;
}

export interface EventLogResponse {
  data: EventLog[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

/**
 * Get events for the current user
 */
export async function getMyEvents(
  filters?: EventLogFilters,
  params?: EventLogQueryParams
): Promise<EventLogResponse> {
  const queryParams = new URLSearchParams();

  if (filters) {
    if (filters.eventType) queryParams.append("eventType", filters.eventType);
    if (filters.audience) queryParams.append("audience", filters.audience);
    if (filters.severity) queryParams.append("severity", filters.severity);
    if (filters.resourceType) queryParams.append("resourceType", filters.resourceType);
    if (filters.resourceId) queryParams.append("resourceId", String(filters.resourceId));
    if (filters.startDate) queryParams.append("startDate", filters.startDate);
    if (filters.endDate) queryParams.append("endDate", filters.endDate);
  }

  if (params) {
    if (params.page) queryParams.append("page", String(params.page));
    if (params.pageSize) queryParams.append("pageSize", String(params.pageSize));
    if (params.sort) {
      const sortValue = Array.isArray(params.sort) ? params.sort.join(",") : params.sort;
      queryParams.append("sort", sortValue);
    }
  }

  const queryString = queryParams.toString();
  const url = `/event-logs/my-events${queryString ? `?${queryString}` : ""}`;

  const response = await apiClient.get<EventLogResponse>(url);
  return response.data;
}

/**
 * Get events for a specific order
 */
export async function getOrderEvents(
  orderId: string | number,
  filters?: Pick<EventLogFilters, "audience" | "severity">,
  params?: EventLogQueryParams
): Promise<EventLogResponse> {
  const queryParams = new URLSearchParams();

  if (filters) {
    if (filters.audience) queryParams.append("audience", filters.audience);
    if (filters.severity) queryParams.append("severity", filters.severity);
  }

  if (params) {
    if (params.page) queryParams.append("page", String(params.page));
    if (params.pageSize) queryParams.append("pageSize", String(params.pageSize));
    if (params.sort) {
      const sortValue = Array.isArray(params.sort) ? params.sort.join(",") : params.sort;
      queryParams.append("sort", sortValue);
    }
  }

  const queryString = queryParams.toString();
  const url = `/event-logs/order/${orderId}${queryString ? `?${queryString}` : ""}`;

  const response = await apiClient.get<EventLogResponse>(url);
  return response.data;
}

/**
 * Get admin events (admin/superadmin only)
 */
export async function getAdminEvents(
  filters?: EventLogFilters,
  params?: EventLogQueryParams
): Promise<EventLogResponse> {
  const queryParams = new URLSearchParams();

  if (filters) {
    if (filters.eventType) queryParams.append("eventType", filters.eventType);
    if (filters.audience) queryParams.append("audience", filters.audience);
    if (filters.severity) queryParams.append("severity", filters.severity);
    if (filters.resourceType) queryParams.append("resourceType", filters.resourceType);
    if (filters.resourceId) queryParams.append("resourceId", String(filters.resourceId));
    if (filters.relatedUserId) queryParams.append("relatedUserId", String(filters.relatedUserId));
    if (filters.startDate) queryParams.append("startDate", filters.startDate);
    if (filters.endDate) queryParams.append("endDate", filters.endDate);
  }

  if (params) {
    if (params.page) queryParams.append("page", String(params.page));
    if (params.pageSize) queryParams.append("pageSize", String(params.pageSize));
    if (params.sort) {
      const sortValue = Array.isArray(params.sort) ? params.sort.join(",") : params.sort;
      queryParams.append("sort", sortValue);
    }
  }

  const queryString = queryParams.toString();
  const url = `/event-logs/admin${queryString ? `?${queryString}` : ""}`;

  const response = await apiClient.get<EventLogResponse>(url);
  return response.data;
}

/**
 * Default export with all functions
 */
const EventLogService = {
  getMyEvents,
  getOrderEvents,
  getAdminEvents,
};

export default EventLogService;
