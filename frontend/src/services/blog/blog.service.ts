import { apiClient } from "@/services";
import { ApiResponse, PaginatedResponse } from "@/types/api";

export interface BlogPost {
  id: number;
  Title: string;
  Slug: string;
  Content: string;
  Excerpt?: string;
  FeaturedImage?: {
    id: number;
    url: string;
    alternativeText?: string;
    width?: number;
    height?: number;
    formats?: {
      large?: { url: string };
      medium?: { url: string };
      small?: { url: string };
      thumbnail?: { url: string };
    };
  };
  Status: "Draft" | "Published" | "Scheduled";
  PublishedAt?: string;
  ViewCount: number;
  MetaTitle?: string;
  MetaDescription?: string;
  Keywords?: string;
  blog_category?: BlogCategory;
  blog_tags?: BlogTag[];
  blog_author?: BlogAuthor;
  blog_comments?: BlogComment[];
  createdAt: string;
  updatedAt: string;
}

export interface BlogCategory {
  id: number;
  Name: string;
  Slug: string;
  Description?: string;
  parent_category?: BlogCategory;
  createdAt: string;
  updatedAt: string;
}

export interface BlogTag {
  id: number;
  Name: string;
  Slug: string;
  Color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogAuthor {
  id: number;
  Name: string;
  Bio?: string;
  Avatar?: {
    id: number;
    url: string;
    alternativeText?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BlogComment {
  id: number;
  Content: string;
  Status: "Pending" | "Approved" | "Rejected";
  Date: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
  blog_post?: { id: number; Title: string };
  parent_comment?: BlogComment;
  replies?: BlogComment[];
  createdAt: string;
  updatedAt: string;
}

export interface BlogListParams {
  page?: number;
  pageSize?: number;
  category?: string;
  tag?: string;
  author?: string;
  search?: string;
  sort?: string;
  status?: "Draft" | "Published" | "Scheduled";
}

export interface CreateBlogPostData {
  Title: string;
  Slug: string;
  Content: string;
  Excerpt?: string;
  Status: "Draft" | "Published" | "Scheduled";
  PublishedAt?: string;
  MetaTitle?: string;
  MetaDescription?: string;
  Keywords?: string;
  blog_category?: number;
  blog_tags?: number[];
  blog_author?: number;
  FeaturedImage?: number;
}

export interface CreateBlogCategoryData {
  Name: string;
  Slug?: string;
  Description?: string;
  parent_category?: number;
}

export interface CreateBlogTagData {
  Name: string;
  Slug?: string;
  Color?: string;
}

export interface CreateBlogAuthorData {
  Name: string;
  Bio?: string;
  Avatar?: number;
}

class BlogService {
  private baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  private getAuthToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken");
    }
    return null;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    const token = this.getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  private unwrapRelation<T extends { id: number }>(rel: any): T | undefined {
    if (!rel?.data) return undefined;
    return { id: rel.data.id, ...(rel.data.attributes || {}) };
  }

  private normalizeBlogPost(entry: any): BlogPost {
    if (!entry) return entry;
    const attrs = entry.attributes || entry;
    const featuredImageData = attrs.FeaturedImage?.data;

    return {
      id: entry.id ?? attrs.id,
      ...attrs,
      blog_category: this.unwrapRelation(attrs.blog_category),
      blog_author: this.unwrapRelation(attrs.blog_author),
      blog_tags: Array.isArray(attrs.blog_tags?.data)
        ? attrs.blog_tags.data.map((tag: any) => this.unwrapRelation(tag)).filter(Boolean) as BlogTag[]
        : attrs.blog_tags || [],
      FeaturedImage: featuredImageData
        ? {
            id: featuredImageData.id,
            ...(featuredImageData.attributes || {}),
          }
        : attrs.FeaturedImage?.data === null
          ? undefined
          : attrs.FeaturedImage,
    };
  }

  // ==================== BLOG POSTS ====================

  // Get all published blog posts (public)
  async getBlogPosts(params: BlogListParams = {}): Promise<PaginatedResponse<BlogPost>> {
    const searchParams = new URLSearchParams();

    // Add pagination
    searchParams.append("pagination[page]", (params.page || 1).toString());
    searchParams.append("pagination[pageSize]", (params.pageSize || 10).toString());

    // Add filters - only filter by status if not admin view
    if (params.status) {
      searchParams.append("filters[Status][$eq]", params.status);
    }

    if (params.category) {
      searchParams.append("filters[blog_category][Slug][$eq]", params.category);
    }

    if (params.tag) {
      searchParams.append("filters[blog_tags][Slug][$eq]", params.tag);
    }

    if (params.author) {
      searchParams.append("filters[blog_author][Slug][$eq]", params.author);
    }

    if (params.search) {
      searchParams.append("filters[$or][0][Title][$containsi]", params.search);
      searchParams.append("filters[$or][1][Content][$containsi]", params.search);
      searchParams.append("filters[$or][2][Excerpt][$containsi]", params.search);
    }

    // Add sorting
    const sortField = params.sort || "createdAt:desc";
    searchParams.append("sort", sortField);

    // Add population
    searchParams.append("populate[blog_category]", "*");
    searchParams.append("populate[blog_tags]", "*");
    searchParams.append("populate[blog_author]", "*");
    searchParams.append("populate[FeaturedImage]", "*");

    const response = await fetch(`${this.baseUrl}/blog-posts?${searchParams}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch blog posts");
    }

    const json = await response.json();
    const normalizedData = Array.isArray(json.data)
      ? json.data.map((item: any) => this.normalizeBlogPost(item))
      : [];

    return {
      data: normalizedData,
      meta: json.meta,
    };
  }

  // Get single blog post by ID (admin)
  async getBlogPostById(id: number): Promise<ApiResponse<BlogPost>> {
    const searchParams = new URLSearchParams();
    searchParams.append("populate[blog_category]", "*");
    searchParams.append("populate[blog_tags]", "*");
    searchParams.append("populate[blog_author][populate][Avatar]", "*");
    searchParams.append("populate[FeaturedImage]", "*");

    const response = await fetch(`${this.baseUrl}/blog-posts/${id}?${searchParams}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Blog post not found");
      }
      throw new Error("Failed to fetch blog post");
    }

    const json = await response.json();
    return { data: this.normalizeBlogPost(json.data), meta: json.meta };
  }

  // Get single blog post by slug (public)
  async getBlogPostBySlug(slug: string): Promise<ApiResponse<BlogPost>> {
    const searchParams = new URLSearchParams();
    searchParams.append("populate[blog_category]", "*");
    searchParams.append("populate[blog_tags]", "*");
    searchParams.append("populate[blog_author][populate][Avatar]", "*");
    searchParams.append("populate[FeaturedImage]", "*");
    searchParams.append("populate[blog_comments][populate][user]", "*");
    searchParams.append("populate[blog_comments][populate][parent_comment]", "*");

    const response = await fetch(`${this.baseUrl}/blog-posts/slug/${slug}?${searchParams}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Blog post not found");
      }
      throw new Error("Failed to fetch blog post");
    }

    const json = await response.json();
    return { data: this.normalizeBlogPost(json.data), meta: json.meta };
  }

  // Create blog post (authenticated)
  async createBlogPost(data: CreateBlogPostData): Promise<ApiResponse<BlogPost>> {
    const response = await fetch(`${this.baseUrl}/blog-posts`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to create blog post");
    }

    const json = await response.json();
    return { data: this.normalizeBlogPost(json.data), meta: json.meta };
  }

  // Update blog post (authenticated)
  async updateBlogPost(id: number, data: Partial<CreateBlogPostData>): Promise<ApiResponse<BlogPost>> {
    const response = await fetch(`${this.baseUrl}/blog-posts/${id}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to update blog post");
    }

    const json = await response.json();
    return { data: this.normalizeBlogPost(json.data), meta: json.meta };
  }

  // Delete blog post (authenticated)
  async deleteBlogPost(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/blog-posts/${id}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to delete blog post");
    }
  }

  // ==================== BLOG CATEGORIES ====================

  // Get blog categories (public)
  async getBlogCategories(): Promise<PaginatedResponse<BlogCategory>> {
    const searchParams = new URLSearchParams();
    searchParams.append("sort", "Title:asc");
    searchParams.append("pagination[pageSize]", "100");

    const response = await fetch(`${this.baseUrl}/blog-categories?${searchParams}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch blog categories");
    }

    return response.json();
  }

  // Create blog category (authenticated)
  async createBlogCategory(data: CreateBlogCategoryData): Promise<ApiResponse<BlogCategory>> {
    // Auto-generate slug if not provided
    const slug = data.Slug || this.generateSlug(data.Name);

    const response = await fetch(`${this.baseUrl}/blog-categories`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ data: { ...data, Slug: slug } }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to create blog category");
    }

    return response.json();
  }

  // Update blog category (authenticated)
  async updateBlogCategory(id: number, data: Partial<CreateBlogCategoryData>): Promise<ApiResponse<BlogCategory>> {
    const response = await fetch(`${this.baseUrl}/blog-categories/${id}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to update blog category");
    }

    return response.json();
  }

  // Delete blog category (authenticated)
  async deleteBlogCategory(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/blog-categories/${id}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to delete blog category");
    }
  }

  // ==================== BLOG TAGS ====================

  // Get blog tags (public)
  async getBlogTags(): Promise<PaginatedResponse<BlogTag>> {
    const searchParams = new URLSearchParams();
    searchParams.append("sort", "Name:asc");
    searchParams.append("pagination[pageSize]", "100");

    const response = await fetch(`${this.baseUrl}/blog-tags?${searchParams}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch blog tags");
    }

    return response.json();
  }

  // Create blog tag (authenticated)
  async createBlogTag(data: CreateBlogTagData): Promise<ApiResponse<BlogTag>> {
    // Auto-generate slug if not provided
    const slug = data.Slug || this.generateSlug(data.Name);

    const response = await fetch(`${this.baseUrl}/blog-tags`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ data: { ...data, Slug: slug } }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to create blog tag");
    }

    return response.json();
  }

  // Update blog tag (authenticated)
  async updateBlogTag(id: number, data: Partial<CreateBlogTagData>): Promise<ApiResponse<BlogTag>> {
    const response = await fetch(`${this.baseUrl}/blog-tags/${id}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to update blog tag");
    }

    return response.json();
  }

  // Delete blog tag (authenticated)
  async deleteBlogTag(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/blog-tags/${id}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to delete blog tag");
    }
  }

  // ==================== BLOG AUTHORS ====================

  // Get blog authors (public)
  async getBlogAuthors(): Promise<PaginatedResponse<BlogAuthor>> {
    const searchParams = new URLSearchParams();
    searchParams.append("sort", "Name:asc");
    searchParams.append("populate[Avatar]", "*");
    searchParams.append("pagination[pageSize]", "100");

    const response = await fetch(`${this.baseUrl}/blog-authors?${searchParams}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch blog authors");
    }

    return response.json();
  }

  // Create blog author (authenticated)
  async createBlogAuthor(data: CreateBlogAuthorData): Promise<ApiResponse<BlogAuthor>> {
    const response = await fetch(`${this.baseUrl}/blog-authors`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to create blog author");
    }

    return response.json();
  }

  // Update blog author (authenticated)
  async updateBlogAuthor(id: number, data: Partial<CreateBlogAuthorData>): Promise<ApiResponse<BlogAuthor>> {
    const response = await fetch(`${this.baseUrl}/blog-authors/${id}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to update blog author");
    }

    return response.json();
  }

  // Delete blog author (authenticated)
  async deleteBlogAuthor(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/blog-authors/${id}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to delete blog author");
    }
  }

  // ==================== BLOG COMMENTS ====================

  // Get comments for a blog post (public - only approved)
  async getBlogComments(postId: number): Promise<ApiResponse<BlogComment[]>> {
    const searchParams = new URLSearchParams();
    searchParams.append("populate[user]", "*");
    searchParams.append("populate[parent_comment]", "*");
    searchParams.append("populate[replies][populate][user]", "*");

    const response = await fetch(`${this.baseUrl}/blog-comments/post/${postId}?${searchParams}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch blog comments");
    }

    return response.json();
  }

  // Get all comments (admin)
  async getAllBlogComments(params: { status?: string; page?: number; pageSize?: number } = {}): Promise<PaginatedResponse<BlogComment>> {
    const searchParams = new URLSearchParams();
    searchParams.append("pagination[page]", (params.page || 1).toString());
    searchParams.append("pagination[pageSize]", (params.pageSize || 20).toString());
    searchParams.append("sort", "createdAt:desc");
    searchParams.append("populate[user]", "*");
    searchParams.append("populate[blog_post]", "*");
    searchParams.append("populate[parent_comment]", "*");

    if (params.status) {
      searchParams.append("filters[Status][$eq]", params.status);
    }

    const response = await fetch(`${this.baseUrl}/blog-comments?${searchParams}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch blog comments");
    }

    return response.json();
  }

  // Create comment (authenticated)
  async createBlogComment(
    postId: number,
    content: string,
    parentCommentId?: number
  ): Promise<ApiResponse<BlogComment>> {
    const response = await fetch(`${this.baseUrl}/blog-comments`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        data: {
          Content: content,
          blog_post: postId,
          parent_comment: parentCommentId,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to create comment");
    }

    return response.json();
  }

  // Update comment status (admin)
  async updateBlogCommentStatus(id: number, status: "Pending" | "Approved" | "Rejected"): Promise<ApiResponse<BlogComment>> {
    const response = await fetch(`${this.baseUrl}/blog-comments/${id}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify({ data: { Status: status } }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to update comment status");
    }

    return response.json();
  }

  // Delete comment (admin)
  async deleteBlogComment(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/blog-comments/${id}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to delete comment");
    }
  }

  // ==================== UTILITIES ====================

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[\s\u200C]+/g, "-") // Replace spaces and ZWNJ with hyphens
      .replace(/[^\w\u0600-\u06FF-]/g, "") // Keep alphanumeric, Persian chars, and hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
  }
}

export const blogService = new BlogService();
