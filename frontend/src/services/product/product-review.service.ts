import { apiClient } from "@/services";
import { ApiResponse, PaginatedResponse } from "@/types/api";

export interface UserInfo {
  FirstName?: string | null;
  LastName?: string | null;
  Phone?: string | null;
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const isUserInfo = (value: unknown): value is UserInfo => {
  if (!isRecord(value)) return false;
  const firstName = value.FirstName;
  const lastName = value.LastName;
  const phone = value.Phone;

  const isMaybeString = (field: unknown) =>
    field === undefined || field === null || typeof field === "string";

  return isMaybeString(firstName) && isMaybeString(lastName) && isMaybeString(phone);
};

export const normalizeUserInfo = (rawUserInfo: unknown): UserInfo | undefined => {
  if (!rawUserInfo) return undefined;

  // Three-level fallback normalization:
  // 1. Check data.attributes
  // 2. Check attributes
  // 3. Check direct value
  if (isRecord(rawUserInfo)) {
    if (isRecord(rawUserInfo.data) && isUserInfo(rawUserInfo.data.attributes)) {
      return rawUserInfo.data.attributes;
    }
    if (isUserInfo(rawUserInfo.attributes)) {
      return rawUserInfo.attributes;
    }
  }
  if (isUserInfo(rawUserInfo)) {
    return rawUserInfo;
  }

  return undefined;
};

export interface ProductReview {
  id: number;
  Content: string;
  Status: "Need for Review" | "Accepted" | "Rejected";
  Date: string;
  Rate: number;
  LikeCounts: number;
  DislikeCounts: number;
  user?: {
    id: number;
    username?: string;
    email?: string;
    user_info?: UserInfo;
    Phone?: string;
  };
  product?: {
    id: number;
    Title: string;
    Slug?: string;
  };
  product_review_replies?: ProductReviewReply[];
  createdAt: string;
  updatedAt: string;
  removedAt?: string | null;
}

export interface ProductReviewReply {
  id: number;
  Content: string;
  user?: {
    id: number;
    username?: string;
    Phone?: string;
    user_info?: UserInfo;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProductReviewListParams {
  page?: number;
  pageSize?: number;
  productId?: number | string;
  status?: string;
  sort?: string;
  search?: string;
}

type ProductReviewQuery = Record<string, string | number | boolean | undefined>;

// Strapi API response structure
interface StrapiApiResponse<T> {
  data: T | T[];
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

// Generic Strapi type definitions
export interface StrapiEntry<T> {
  id: number;
  attributes: T;
}

export interface StrapiRelation<T> {
  data: T | T[] | null;
}

// Attribute interfaces for Strapi entities
interface UserAttributes {
  username?: string | null;
  email?: string | null;
  Phone?: string | null;
  user_info?: StrapiRelation<StrapiEntry<UserInfo>> | null;
}

interface ProductAttributes {
  Title: string;
  Slug?: string | null;
}

interface ProductReviewReplyAttributes {
  Content: string;
  user?: StrapiRelation<StrapiEntry<UserAttributes>> | null;
  createdAt: string;
  updatedAt: string;
}

interface ProductReviewAttributes {
  Content: string;
  Status: "Need for Review" | "Accepted" | "Rejected";
  Date: string;
  Rate: number;
  LikeCounts: number;
  DislikeCounts: number;
  user?: StrapiRelation<StrapiEntry<UserAttributes>> | null;
  product?: StrapiRelation<StrapiEntry<ProductAttributes>> | null;
  product_review_replies?: StrapiRelation<StrapiEntry<ProductReviewReplyAttributes>> | null;
  createdAt: string;
  updatedAt: string;
  removedAt?: string | null;
}

// Normalized user type (after unwrapping)
interface NormalizedUser {
  id: number;
  username?: string | null;
  email?: string | null;
  Phone?: string | null;
  user_info?: UserInfo;
}

// Normalized product type (after unwrapping)
interface NormalizedProduct {
  id: number;
  Title: string;
  Slug?: string | null;
}

// Normalized reply type (after unwrapping)
interface NormalizedReply {
  id: number;
  Content: string;
  user?: NormalizedUser;
  createdAt: string;
  updatedAt: string;
}

class ProductReviewService {
  private unwrapRelation<T>(
    rel: StrapiRelation<StrapiEntry<T>> | null | undefined
  ): (T & { id: number }) | (T & { id: number })[] | undefined {
    if (!rel?.data) return undefined;
    if (Array.isArray(rel.data)) {
      return rel.data.map((item) => ({
        id: item.id,
        ...item.attributes,
      }));
    }
    return { id: rel.data.id, ...rel.data.attributes };
  }

  private normalizeReview(entry: StrapiEntry<ProductReviewAttributes>): ProductReview {
    if (!entry) {
      throw new Error("Cannot normalize empty review entry");
    }
    const attrs = entry.attributes;

    // Normalize user
    const unwrappedUser = this.unwrapRelation(attrs.user);
    let normalizedUser: ProductReview["user"];
    if (unwrappedUser && !Array.isArray(unwrappedUser)) {
      const userInfo = normalizeUserInfo(unwrappedUser.user_info);
      normalizedUser = {
        id: unwrappedUser.id,
        username: unwrappedUser.username ?? undefined,
        email: unwrappedUser.email ?? undefined,
        Phone: unwrappedUser.Phone ?? undefined,
        user_info: userInfo,
      };
    }

    // Normalize product
    const unwrappedProduct = this.unwrapRelation(attrs.product);
    const normalizedProduct: ProductReview["product"] =
      unwrappedProduct && !Array.isArray(unwrappedProduct)
        ? {
            id: unwrappedProduct.id,
            Title: unwrappedProduct.Title,
            Slug: unwrappedProduct.Slug ?? undefined,
          }
        : undefined;

    // Normalize replies
    const rawReplies = this.unwrapRelation(attrs.product_review_replies);
    const replyArray = Array.isArray(rawReplies) ? rawReplies : rawReplies ? [rawReplies] : [];
    const normalizedReplies: ProductReviewReply[] = replyArray.map((reply) => {
      // reply.user is a relation that needs unwrapping
      const replyUserRelation = (reply as ProductReviewReplyAttributes & { id: number }).user;
      const unwrappedReplyUser = replyUserRelation
        ? this.unwrapRelation(replyUserRelation)
        : undefined;

      let replyUser: ProductReviewReply["user"];
      if (unwrappedReplyUser && !Array.isArray(unwrappedReplyUser)) {
        const replyUserInfo = normalizeUserInfo(unwrappedReplyUser.user_info);
        replyUser = {
          id: unwrappedReplyUser.id,
          username: unwrappedReplyUser.username ?? undefined,
          Phone: unwrappedReplyUser.Phone ?? undefined,
          user_info: replyUserInfo,
        };
      }

      return {
        id: reply.id,
        Content: reply.Content,
        user: replyUser,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
      };
    });

    return {
      id: entry.id,
      Content: attrs.Content,
      Status: attrs.Status,
      Date: attrs.Date,
      Rate: attrs.Rate,
      LikeCounts: attrs.LikeCounts,
      DislikeCounts: attrs.DislikeCounts,
      user: normalizedUser,
      product: normalizedProduct,
      product_review_replies: normalizedReplies,
      createdAt: attrs.createdAt,
      updatedAt: attrs.updatedAt,
      removedAt: attrs.removedAt,
    };
  }

  // Get approved reviews for a specific product
  async getProductReviews(productId: number | string, params: ProductReviewListParams = {}): Promise<PaginatedResponse<ProductReview>> {
    const query: ProductReviewQuery = {
      "filters[product][id][$eq]": productId.toString(),
      "filters[Status][$eq]": "Accepted",
      "filters[removedAt][$null]": "true",
      "pagination[page]": params.page || 1,
      "pagination[pageSize]": params.pageSize || 10,
      "sort": params.sort || "createdAt:desc",
      "populate[user][populate][0]": "user_info",
      "populate[product_review_replies][populate][user][populate][0]": "user_info",
    };

    const response = await apiClient.get<StrapiApiResponse<StrapiEntry<ProductReviewAttributes>>>(
      "/product-reviews",
      { params: query }
    );

    const dataArray = Array.isArray(response.data) ? response.data : response.data ? [response.data] : [];
    return {
      data: dataArray.map((item) => this.normalizeReview(item)),
      meta: {
        currentPage: response.meta?.pagination?.page || 1,
        totalPages: response.meta?.pagination?.pageCount || 1,
        totalItems: response.meta?.pagination?.total || 0,
        itemsPerPage: response.meta?.pagination?.pageSize || 10,
      },
    };
  }

  // Get all reviews for admin moderation
  async getAllReviews(params: ProductReviewListParams = {}): Promise<PaginatedResponse<ProductReview>> {
    const query: ProductReviewQuery = {
      "filters[removedAt][$null]": "true",
      "pagination[page]": params.page || 1,
      "pagination[pageSize]": params.pageSize || 20,
      "sort": params.sort || "createdAt:desc",
      "populate[user][populate][0]": "user_info",
      "populate[product]": "*",
    };

    if (params.status && params.status !== "all") {
      query["filters[Status][$eq]"] = params.status;
    }

    if (params.search) {
      query["filters[Content][$containsi]"] = params.search;
    }

    const response = await apiClient.get<StrapiApiResponse<StrapiEntry<ProductReviewAttributes>>>(
      "/product-reviews",
      { params: query }
    );

    const dataArray = Array.isArray(response.data) ? response.data : response.data ? [response.data] : [];
    return {
      data: dataArray.map((item) => this.normalizeReview(item)),
      meta: {
        currentPage: response.meta?.pagination?.page || 1,
        totalPages: response.meta?.pagination?.pageCount || 1,
        totalItems: response.meta?.pagination?.total || 0,
        itemsPerPage: response.meta?.pagination?.pageSize || 10,
      },
    };
  }

  // Submit a new review
  async submitReview(productId: number | string, rate: number, content: string): Promise<ApiResponse<ProductReview>> {
    const response = await apiClient.post<StrapiApiResponse<StrapiEntry<ProductReviewAttributes>>>(
      "/product-reviews",
      {
        data: {
          product: productId,
          Rate: rate,
          Content: content,
          Date: new Date().toISOString(),
          Status: "Need for Review",
        },
      }
    );

    const responseData = Array.isArray(response.data) ? response.data[0] : response.data;
    return {
      data: this.normalizeReview(responseData),
      meta: response.meta,
    };
  }

  // Update review status (Admin)
  async updateStatus(id: number | string, status: "Need for Review" | "Accepted" | "Rejected"): Promise<ApiResponse<ProductReview>> {
    const response = await apiClient.put<StrapiApiResponse<StrapiEntry<ProductReviewAttributes>>>(
      `/product-reviews/${id}`,
      {
        data: { Status: status },
      }
    );

    const responseData = Array.isArray(response.data) ? response.data[0] : response.data;
    return {
      data: this.normalizeReview(responseData),
      meta: response.meta,
    };
  }

  // Delete review (Admin - soft delete)
  async deleteReview(id: number | string): Promise<void> {
    await apiClient.put(`/product-reviews/${id}`, {
      data: { removedAt: new Date().toISOString() },
    });
  }
}

export const productReviewService = new ProductReviewService();
