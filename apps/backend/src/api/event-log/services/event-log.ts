/**
 * event-log service
 */

import { factories } from "@strapi/strapi";
import type { EventType, Audience, Severity } from "../../../utils/eventMessages";

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
  filters?: EventLogFilters;
  page?: number;
  pageSize?: number;
  sort?: string | string[];
}

export default factories.createCoreService(
  "api::event-log.event-log" as any,
  ({ strapi }) => ({
    /**
     * Get events for a specific user
     */
    async getUserEvents(userId: number, params: EventLogQueryParams = {}) {
      const { filters = {}, page = 1, pageSize = 20, sort = ["createdAt:desc"] } = params;

      const queryFilters: any = {
        $and: [
          {
            $or: [
              { RelatedUserId: userId },
              { Audience: { $in: ["user", "all"] } },
            ],
          },
        ],
      };

      // Apply filters
      if (filters.eventType) {
        queryFilters.$and.push({ EventType: filters.eventType });
      }
      if (filters.audience) {
        queryFilters.$and.push({
          Audience: { $in: [filters.audience, "all"] },
        });
      }
      if (filters.severity) {
        queryFilters.$and.push({ Severity: filters.severity });
      }
      if (filters.resourceType) {
        queryFilters.$and.push({ ResourceType: filters.resourceType });
      }
      if (filters.resourceId) {
        queryFilters.$and.push({ ResourceId: String(filters.resourceId) });
      }
      if (filters.startDate || filters.endDate) {
        const dateFilter: any = {};
        if (filters.startDate) {
          dateFilter.$gte = filters.startDate;
        }
        if (filters.endDate) {
          dateFilter.$lte = filters.endDate;
        }
        queryFilters.$and.push({ createdAt: dateFilter });
      }

      const start = (page - 1) * pageSize;
      const limit = pageSize;

      const [results, total] = await Promise.all([
        strapi.entityService.findMany("api::event-log.event-log" as any, {
          filters: queryFilters,
          populate: {
            performed_by: {
              fields: ["id", "username", "email"],
            },
          },
          sort: Array.isArray(sort) ? sort : [sort],
          limit,
          start,
        }),
        strapi.entityService.count("api::event-log.event-log" as any, {
          filters: queryFilters,
        }),
      ]);

      return {
        data: results || [],
        meta: {
          pagination: {
            page,
            pageSize: limit,
            pageCount: Math.ceil(total / limit),
            total,
          },
        },
      };
    },

    /**
     * Get events for admins/superadmins
     */
    async getAdminEvents(params: EventLogQueryParams = {}) {
      const { filters = {}, page = 1, pageSize = 20, sort = ["createdAt:desc"] } = params;

      const queryFilters: any = {
        $and: [
          {
            Audience: { $in: ["admin", "superadmin", "all"] },
          },
        ],
      };

      // Apply filters
      if (filters.eventType) {
        queryFilters.$and.push({ EventType: filters.eventType });
      }
      if (filters.audience) {
        queryFilters.$and.push({
          Audience: { $in: [filters.audience, "all"] },
        });
      }
      if (filters.severity) {
        queryFilters.$and.push({ Severity: filters.severity });
      }
      if (filters.resourceType) {
        queryFilters.$and.push({ ResourceType: filters.resourceType });
      }
      if (filters.resourceId) {
        queryFilters.$and.push({ ResourceId: String(filters.resourceId) });
      }
      if (filters.relatedUserId) {
        queryFilters.$and.push({ RelatedUserId: filters.relatedUserId });
      }
      if (filters.startDate || filters.endDate) {
        const dateFilter: any = {};
        if (filters.startDate) {
          dateFilter.$gte = filters.startDate;
        }
        if (filters.endDate) {
          dateFilter.$lte = filters.endDate;
        }
        queryFilters.$and.push({ createdAt: dateFilter });
      }

      const start = (page - 1) * pageSize;
      const limit = pageSize;

      const [results, total] = await Promise.all([
        strapi.entityService.findMany("api::event-log.event-log" as any, {
          filters: queryFilters,
          populate: {
            performed_by: {
              fields: ["id", "username", "email"],
            },
          },
          sort: Array.isArray(sort) ? sort : [sort],
          limit,
          start,
        }),
        strapi.entityService.count("api::event-log.event-log" as any, {
          filters: queryFilters,
        }),
      ]);

      return {
        data: results || [],
        meta: {
          pagination: {
            page,
            pageSize: limit,
            pageCount: Math.ceil(total / limit),
            total,
          },
        },
      };
    },

    /**
     * Get events related to a specific order
     */
    async getOrderEvents(orderId: string | number, params: EventLogQueryParams = {}) {
      const { page = 1, pageSize = 50, sort = ["createdAt:asc"] } = params;

      const queryFilters: any = {
        $and: [
          {
            ResourceType: "Order",
            ResourceId: String(orderId),
          },
        ],
      };

      // Apply additional filters
      if (params.filters) {
        if (params.filters.audience) {
          queryFilters.$and.push({
            Audience: { $in: [params.filters.audience, "all"] },
          });
        }
        if (params.filters.severity) {
          queryFilters.$and.push({ Severity: params.filters.severity });
        }
      }

      const start = (page - 1) * pageSize;
      const limit = pageSize;

      const [results, total] = await Promise.all([
        strapi.entityService.findMany("api::event-log.event-log" as any, {
          filters: queryFilters,
          populate: {
            performed_by: {
              fields: ["id", "username", "email"],
            },
          },
          sort: Array.isArray(sort) ? sort : [sort],
          limit,
          start,
        }),
        strapi.entityService.count("api::event-log.event-log" as any, {
          filters: queryFilters,
        }),
      ]);

      return {
        data: results || [],
        meta: {
          pagination: {
            page,
            pageSize: limit,
            pageCount: Math.ceil(total / limit),
            total,
          },
        },
      };
    },
  })
);
