import { apiClient } from "@/services";
import { ApiResponse, PaginatedResponse } from "@/types/api";
import { API_BASE_URL } from "@/constants/api";
import logger from "@/utils/logger";

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
    user_info?: any;
    Phone?: string;
  };
  product?: {
    id: number;
    Title: string;
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
    user_info?: any;
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

class ProductReviewService {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }
    return headers;
  }

  private unwrapRelation(rel: any): any {
    if (!rel?.data) return undefined;
    if (Array.isArray(rel.data)) {
      return rel.data.map((item: any) => ({
        id: item.id,
        ...(item.attributes || {}),
      }));
    }
    return { id: rel.data.id, ...(rel.data.attributes || {}) };
  }

  private normalizeReview(entry: any): ProductReview {
    if (!entry) return entry;
    const attrs = entry.attributes || entry;

    // Normalize user
    let normalizedUser = this.unwrapRelation(attrs.user);
    if (normalizedUser) {
      const userInfo = this.unwrapRelation(normalizedUser.user_info) || normalizedUser.user_info;
      normalizedUser = {
        ...normalizedUser,
        user_info: userInfo,
      };
    }

    // Normalize product
    const normalizedProduct = this.unwrapRelation(attrs.product);

    // Normalize replies
    const rawReplies = this.unwrapRelation(attrs.product_review_replies) || [];
    const normalizedReplies = Array.isArray(rawReplies)
      ? rawReplies.map((reply: any) => {
          let replyUser = this.unwrapRelation(reply.user);
          if (replyUser) {
            const replyUserInfo = this.unwrapRelation(replyUser.user_info) || replyUser.user_info;
            replyUser = { ...replyUser, user_info: replyUserInfo };
          }
          return {
            id: reply.id,
            ...reply,
            user: replyUser,
          };
        })
      : [];

    return {
      id: entry.id ?? attrs.id,
      ...attrs,
      user: normalizedUser,
      product: normalizedProduct,
      product_review_replies: normalizedReplies,
    };
  }

  // Get approved reviews for a specific product
  async getProductReviews(productId: number | string, params: ProductReviewListParams = {}): Promise<PaginatedResponse<ProductReview>> {
    const searchParams = new URLSearchParams();
    searchParams.append("filters[product][id][$eq]", productId.toString());
    searchParams.append("filters[Status][$eq]", "Accepted");
    searchParams.append("filters[removedAt][$null]", "true");

    searchParams.append("pagination[page]", (params.page || 1).toString());
    searchParams.append("pagination[pageSize]", (params.pageSize || 10).toString());
    searchParams.append("sort", params.sort || "createdAt:desc");

    searchParams.append("populate[user][populate][user_info]", "*");
    searchParams.append("populate[product_review_replies][populate][user][populate][user_info]", "*");

    const response = await fetch(`${API_BASE_URL}/product-reviews?${searchParams}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch product reviews");
    }

    const json = await response.json();
    return {
      data: (json.data || []).map((item: any) => this.normalizeReview(item)),
      meta: json.meta,
    };
  }

  // Get all reviews for admin moderation
  async getAllReviews(params: ProductReviewListParams = {}): Promise<PaginatedResponse<ProductReview>> {
    const searchParams = new URLSearchParams();

    if (params.status && params.status !== "all") {
      searchParams.append("filters[Status][$eq]", params.status);
    }

    if (params.search) {
      searchParams.append("filters[Content][$containsi]", params.search);
    }

    searchParams.append("pagination[page]", (params.page || 1).toString());
    searchParams.append("pagination[pageSize]", (params.pageSize || 20).toString());
    searchParams.append("sort", params.sort || "createdAt:desc");

    searchParams.append("populate[user][populate][user_info]", "*");
    searchParams.append("populate[product]", "*");
    searchParams.append("filters[removedAt][$null]", "true");

    const response = await fetch(`${API_BASE_URL}/product-reviews?${searchParams}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch all reviews");
    }

    const json = await response.json();
    return {
      data: (json.data || []).map((item: any) => this.normalizeReview(item)),
      meta: json.meta,
    };
  }

  // Submit a new review
  async submitReview(productId: number | string, rate: number, content: string): Promise<ApiResponse<ProductReview>> {
    const response = await fetch(`${API_BASE_URL}/product-reviews`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        data: {
          product: productId,
          Rate: rate,
          Content: content,
          Date: new Date().toISOString(),
          Status: "Need for Review",
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to submit review");
    }

    const json = await response.json();
    return { data: this.normalizeReview(json.data), meta: json.meta };
  }

  // Update review status (Admin)
  async updateStatus(id: number | string, status: "Need for Review" | "Accepted" | "Rejected"): Promise<ApiResponse<ProductReview>> {
    const response = await fetch(`${API_BASE_URL}/product-reviews/${id}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify({
        data: { Status: status },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to update review status");
    }

    const json = await response.json();
    return { data: this.normalizeReview(json.data), meta: json.meta };
  }

  // Delete review (Admin - soft delete)
  async deleteReview(id: number | string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/product-reviews/${id}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify({
        data: { removedAt: new Date().toISOString() },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to delete review");
    }
  }
}

export const productReviewService = new ProductReviewService();

