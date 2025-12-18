import { apiClient } from "@/services";
import { ApiResponse, PaginatedResponse } from "@/types/api";

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

type ProductReviewQuery = Record<string, string | number | boolean | undefined>;

class ProductReviewService {
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
    if (!entry) {
      throw new Error("Cannot normalize empty review entry");
    }
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

    const response = await apiClient.get<any>("/product-reviews", { params: query });

    return {
      data: (response.data || []).map((item: any) => this.normalizeReview(item)),
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

    const response = await apiClient.get<any>("/product-reviews", { params: query });

    return {
      data: (response.data || []).map((item: any) => this.normalizeReview(item)),
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
    const response = await apiClient.post<any>("/product-reviews", {
      data: {
        product: productId,
        Rate: rate,
        Content: content,
        Date: new Date().toISOString(),
        Status: "Need for Review",
      },
    });

    return {
      data: this.normalizeReview(response.data),
      meta: response.meta,
    };
  }

  // Update review status (Admin)
  async updateStatus(id: number | string, status: "Need for Review" | "Accepted" | "Rejected"): Promise<ApiResponse<ProductReview>> {
    const response = await apiClient.put<any>(`/product-reviews/${id}`, {
      data: { Status: status },
    });

    return {
      data: this.normalizeReview(response.data),
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
