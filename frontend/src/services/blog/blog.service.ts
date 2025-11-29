import { apiClient } from "@/services";
import { ApiResponse, PaginatedResponse } from "@/types/api";
import { API_BASE_URL } from "@/constants/api";

export interface BlogPost {
  id: number;
  Title: string;
  Slug: string;
  Content: string;
  ShortContent?: string;
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
  Name?: string;
  Title?: string;
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
  Email?: string;
  Avatar?: {
    id: number;
    url: string;
    alternativeText?: string;
  };
  users_permissions_user?: {
    id: number;
    username?: string;
    email?: string;
  };
  ResolvedName?: string;
  ResolvedAuthorName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogComment {
  id: number;
  Content: string;
  Status: "Pending" | "Approved" | "Rejected";
  Date: string;
  Name?: string;
  user?: {
    id: number;
    username?: string;
    email?: string;
    user_info?: BlogUserInfo | null;
  };
  blog_post?: { id: number; Title: string ; Slug?: string };
  parent_comment?: BlogComment;
  replies?: BlogComment[];
  createdAt: string;
  updatedAt: string;
}

export interface BlogUserInfo {
  id?: number;
  FirstName?: string;
  LastName?: string;
  [key: string]: any;
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
  Name?: string;
  Title?: string;
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
  private getBaseUrl(): string {
    // Use the centralized API_BASE_URL constant which is already properly configured
    // This ensures consistency across the application
    return API_BASE_URL;
  }

  private getAuthToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken");
    }
    // TODO: For SSR, consider reading from cookies or passing token from server context
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

  private unwrapRelation(rel: any): { id: number; [key: string]: any } | undefined {
    if (!rel?.data) return undefined;
    return { id: rel.data.id, ...(rel.data.attributes || {}) };
  }

  private normalizeBlogCommentUser(userEntry: any): BlogComment["user"] | undefined {
    const unwrapped = this.unwrapRelation(userEntry);
    if (!unwrapped) return undefined;

    const userInfoCandidate =
      userEntry?.data?.attributes?.user_info ??
      userEntry?.attributes?.user_info ??
      unwrapped.user_info;

    const normalizedUserInfo =
      this.unwrapRelation(userInfoCandidate) ??
      userInfoCandidate?.attributes ??
      userInfoCandidate ??
      null;

    return {
      id: unwrapped.id,
      username: unwrapped.username,
      email: unwrapped.email,
      user_info: normalizedUserInfo ? { ...normalizedUserInfo } : null,
    };
  }

  private normalizeBlogComment(entry: any): BlogComment {
    if (!entry) return entry;
    const attrs = entry.attributes || entry;
    const blogPostRelation =
      this.unwrapRelation(attrs.blog_post) ||
      (attrs.blog_post?.attributes
        ? { id: attrs.blog_post.id, ...(attrs.blog_post.attributes || {}) }
        : attrs.blog_post);

    const replies =
      Array.isArray(attrs.replies?.data)
        ? attrs.replies.data.map((item: any) => this.normalizeBlogComment(item)).filter(Boolean)
        : attrs.replies || [];

    return {
      id: entry.id ?? attrs.id,
      ...attrs,
      Name: attrs.Name || entry.Name,
      user: this.normalizeBlogCommentUser(attrs.user),
      blog_post: blogPostRelation
        ? {
            id: blogPostRelation.id,
            Title: blogPostRelation.Title || blogPostRelation.title,
            Slug: blogPostRelation.Slug || blogPostRelation.slug,
          }
        : undefined,
      parent_comment: this.unwrapRelation(attrs.parent_comment),
      replies,
    };
  }

  private normalizeBlogCategory(entry: any): BlogCategory | undefined {
    if (!entry) return undefined;
    return this.normalizeCategoryReference(entry);
  }

  private normalizeBlogTag(entry: any): BlogTag | undefined {
    if (!entry) return undefined;
    return this.normalizeTagReference(entry);
  }

  private normalizeBlogAuthor(entry: any): BlogAuthor | undefined {
    if (!entry) return undefined;
    const relation = this.unwrapRelation(entry);
    const source = relation?.attributes || relation || entry?.attributes || entry;
    if (!source) return undefined;

    // Unwrap users_permissions_user relation if present
    const userRelation = source.users_permissions_user;
    const unwrappedUser = userRelation?.data
      ? { id: userRelation.data.id, ...(userRelation.data.attributes || {}) }
      : userRelation;

    // Unwrap Avatar relation if present
    const avatarRelation = source.Avatar;
    const unwrappedAvatar = avatarRelation?.data
      ? {
          id: avatarRelation.data.id,
          url: avatarRelation.data.attributes?.url || avatarRelation.data.url,
          alternativeText: avatarRelation.data.attributes?.alternativeText || avatarRelation.data.alternativeText,
        }
      : avatarRelation
        ? {
            id: avatarRelation.id,
            url: avatarRelation.url || avatarRelation.attributes?.url,
            alternativeText: avatarRelation.alternativeText || avatarRelation.attributes?.alternativeText,
          }
        : undefined;

    // Extract name - prefer ResolvedName or ResolvedAuthorName, fallback to Name
    const normalizedName = source.ResolvedName || source.ResolvedAuthorName || source.Name || source.name || "";

    return {
      id: source.id ?? entry.id ?? relation?.id,
      Name: normalizedName,
      Bio: source.Bio || source.bio,
      Email: source.Email || source.email || unwrappedUser?.email,
      Avatar: unwrappedAvatar,
      users_permissions_user: unwrappedUser
        ? {
            id: unwrappedUser.id,
            username: unwrappedUser.username,
            email: unwrappedUser.email,
          }
        : undefined,
      ResolvedName: source.ResolvedName,
      ResolvedAuthorName: source.ResolvedAuthorName,
      createdAt: source.createdAt,
      updatedAt: source.updatedAt,
    };
  }


  private createShortContent(html: string, maxLength: number = 140): string {
  if (!html) return "";

  // Try to find the first <p>...</p>
  const pMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);

  // If we found a <p>, use only its inner HTML
  const raw = pMatch ? pMatch[1] : "";

  // If you REALLY want a generic fallback when no <p> exists,
  // change "" to html instead. For now we respect "only p".
  const source = raw || "";

  // Strip inner tags (strong, span, a, etc.) from the paragraph
  const text = source
    .replace(/<[^>]+>/g, "") // remove any remaining HTML tags
    .replace(/\s+/g, " ") // normalize whitespace
    .trim();

  if (!text) return "";

  return text.length > maxLength ? text.slice(0, maxLength).trimEnd() + "..." : text;
  }

  private normalizeCategoryReference(entry: any): BlogCategory | undefined {
    if (!entry) return undefined;
    const relation = this.unwrapRelation(entry);
    const source = relation?.attributes || relation || entry?.attributes || entry;
    if (!source) return undefined;
    const normalizedName = source.Name || source.Title || source.name || source.title || "";
    const normalizedTitle = source.Title || normalizedName;

    return {
      id: source.id ?? entry.id ?? relation?.id,
      Name: normalizedName,
      Title: normalizedTitle,
      Slug: source.Slug || source.slug || "",
      Description: source.Description || source.description || "",
      parent_category: source.parent_category
        ? this.normalizeCategoryReference(source.parent_category)
        : undefined,
      createdAt: source.createdAt,
      updatedAt: source.updatedAt,
    };
  }

  private normalizeTagReference(entry: any): BlogTag | undefined {
    if (!entry) return undefined;
    const relation = this.unwrapRelation(entry);
    const source = relation?.attributes || relation || entry?.attributes || entry;
    if (!source) return undefined;
    return {
      id: source.id ?? entry.id ?? relation?.id,
      Name: source.Name || source.name || "",
      Slug: source.Slug || source.slug || "",
      Color: source.Color || source.color || "",
      createdAt: source.createdAt,
      updatedAt: source.updatedAt,
    };
  }

  private normalizeBlogPost(entry: any): BlogPost {
    if (!entry) return entry;
    const attrs = entry.attributes || entry;
    const featuredImageData = attrs.FeaturedImage?.data;
    const authorData = attrs.blog_author?.data || attrs.blog_author;
    const authorAttrs = authorData?.attributes || authorData;
    const ShortContent = this.createShortContent(attrs.Content || "", 150);

    return {
      id: entry.id ?? attrs.id,
      ...attrs,
      ShortContent: ShortContent,
      blog_category: this.normalizeCategoryReference(attrs.blog_category),
      blog_author: authorAttrs
        ? {
            id: authorData?.id ?? authorAttrs.id,
            ...authorAttrs,
          }
        : this.unwrapRelation(attrs.blog_author),
      blog_tags: Array.isArray(attrs.blog_tags?.data)
        ? attrs.blog_tags.data.map((tag: any) => this.normalizeTagReference(tag)).filter(Boolean) as BlogTag[]
        : Array.isArray(attrs.blog_tags)
          ? (attrs.blog_tags.map((tag: any) => this.normalizeTagReference(tag)).filter(Boolean) as BlogTag[])
          : [],
      FeaturedImage: featuredImageData
        ? {
            id: featuredImageData.id,
            ...(featuredImageData.attributes || {}),
            url:
              featuredImageData.attributes?.formats?.medium?.url ||
              featuredImageData.attributes?.formats?.small?.url ||
              featuredImageData.attributes?.formats?.large?.url ||
              featuredImageData.attributes?.formats?.thumbnail?.url ||
              featuredImageData.attributes?.url,
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

    const baseUrl = this.getBaseUrl();
    const response = await fetch(`${baseUrl}/blog-posts?${searchParams}`, {
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
    searchParams.append("populate[blog_author]", "*");
    searchParams.append("populate[FeaturedImage]", "*");

    const baseUrl = this.getBaseUrl();
    const response = await fetch(`${baseUrl}/blog-posts/${id}?${searchParams}`, {
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
    const baseUrl = this.getBaseUrl();
    // The slug from Next.js params is already URL-decoded
    // We need to encode it for the URL path, but be careful with special characters
    // encodeURIComponent handles most cases, but we should preserve the slug as-is if it's already encoded
    const cleanSlug = decodeURIComponent(slug); // Decode first in case it's double-encoded
    const encodedSlug = encodeURIComponent(cleanSlug);

    const searchParams = new URLSearchParams();
    searchParams.append("populate[blog_category]", "*");
    searchParams.append("populate[blog_tags]", "*");
    searchParams.append("populate[blog_author]", "*");
    searchParams.append("populate[FeaturedImage]", "*");
    searchParams.append("populate[blog_comments][populate][user]", "*");
    searchParams.append("populate[blog_comments][populate][parent_comment]", "*");

    const url = `${baseUrl}/blog-posts/slug/${encodedSlug}?${searchParams}`;

    // Log the request for debugging (server-side only)
    if (typeof window === 'undefined') {
      console.log(`[BlogService] Fetching blog post:`, {
        originalSlug: slug,
        cleanSlug,
        encodedSlug,
        url: url.replace(encodedSlug, '[SLUG]'), // Don't log full URL with slug
        baseUrl,
      });
    }

    const response = await fetch(url, {
      headers: this.getHeaders(),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response');
      const errorMessage = `Failed to fetch blog post: ${response.status} ${response.statusText}`;

      if (typeof window === 'undefined') {
        console.error(`[BlogService] API error for slug "${slug}":`, {
          status: response.status,
          statusText: response.statusText,
          url: url.replace(encodedSlug, '[SLUG]'),
          baseUrl,
          errorText: errorText.slice(0, 200), // Limit error text length
        });
      }

      if (response.status === 404) {
        throw new Error(`Blog post not found: ${slug}`);
      }
      throw new Error(errorMessage);
    }

    const json = await response.json();

    // Validate response structure
    if (!json || !json.data) {
      const errorMessage = `Invalid API response structure for slug: ${slug}`;
      if (typeof window === 'undefined') {
        console.error(`[BlogService] ${errorMessage}`, {
          json: json ? Object.keys(json) : 'null',
          hasData: !!json?.data,
        });
      }
      throw new Error(errorMessage);
    }

    return { data: this.normalizeBlogPost(json.data), meta: json.meta };
  }

  // Create blog post (authenticated)
  async createBlogPost(data: CreateBlogPostData): Promise<ApiResponse<BlogPost>> {
    const response = await fetch(`${this.getBaseUrl()}/blog-posts`, {
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
    const response = await fetch(`${this.getBaseUrl()}/blog-posts/${id}`, {
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
    const response = await fetch(`${this.getBaseUrl()}/blog-posts/${id}`, {
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

    const baseUrl = this.getBaseUrl();
    const response = await fetch(`${baseUrl}/blog-categories?${searchParams}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch blog categories");
    }

    const json = await response.json();
    const normalizedData = Array.isArray(json.data)
      ? json.data.map((item: any) => this.normalizeBlogCategory(item)).filter(Boolean)
      : [];

    return {
      data: normalizedData as BlogCategory[],
      meta: json.meta,
    };
  }

  // Create blog category (authenticated)
  async createBlogCategory(data: CreateBlogCategoryData): Promise<ApiResponse<BlogCategory>> {
    const title = data.Title || data.Name;
    if (!title) {
      throw new Error("Title is required");
    }

    const slug = data.Slug || this.generateSlug(title);
    const payload: Record<string, unknown> = {
      ...data,
      Title: title,
      Slug: slug,
    };
    delete payload.Name;

    const response = await fetch(`${this.getBaseUrl()}/blog-categories`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ data: payload }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to create blog category");
    }

    const json = await response.json();
    return {
      data: this.normalizeBlogCategory(json.data) as BlogCategory,
      meta: json.meta,
    };
  }

  // Update blog category (authenticated)
  async updateBlogCategory(id: number, data: Partial<CreateBlogCategoryData>): Promise<ApiResponse<BlogCategory>> {
    const payload: Record<string, unknown> = { ...data };
    if (!payload.Title && payload.Name) {
      payload.Title = payload.Name;
    }
    delete payload.Name;

    const response = await fetch(`${this.getBaseUrl()}/blog-categories/${id}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify({ data: payload }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to update blog category");
    }

    const json = await response.json();
    return {
      data: this.normalizeBlogCategory(json.data) as BlogCategory,
      meta: json.meta,
    };
  }

  // Delete blog category (authenticated)
  async deleteBlogCategory(id: number): Promise<void> {
    const response = await fetch(`${this.getBaseUrl()}/blog-categories/${id}`, {
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

    const response = await fetch(`${this.getBaseUrl()}/blog-tags?${searchParams}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch blog tags");
    }

    const json = await response.json();
    const normalizedData = Array.isArray(json.data)
      ? json.data.map((item: any) => this.normalizeBlogTag(item)).filter(Boolean)
      : [];

    return {
      data: normalizedData as BlogTag[],
      meta: json.meta,
    };
  }

  // Create blog tag (authenticated)
  async createBlogTag(data: CreateBlogTagData): Promise<ApiResponse<BlogTag>> {
    // Auto-generate slug if not provided
    const slug = data.Slug || this.generateSlug(data.Name);

    const response = await fetch(`${this.getBaseUrl()}/blog-tags`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ data: { ...data, Slug: slug } }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to create blog tag");
    }

    const json = await response.json();
    return {
      data: this.normalizeBlogTag(json.data) as BlogTag,
      meta: json.meta,
    };
  }

  // Update blog tag (authenticated)
  async updateBlogTag(id: number, data: Partial<CreateBlogTagData>): Promise<ApiResponse<BlogTag>> {
    const response = await fetch(`${this.getBaseUrl()}/blog-tags/${id}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to update blog tag");
    }

    const json = await response.json();
    return {
      data: this.normalizeBlogTag(json.data) as BlogTag,
      meta: json.meta,
    };
  }

  // Delete blog tag (authenticated)
  async deleteBlogTag(id: number): Promise<void> {
    const response = await fetch(`${this.getBaseUrl()}/blog-tags/${id}`, {
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
    searchParams.append("populate[users_permissions_user]", "*");
    searchParams.append("pagination[pageSize]", "100");

    const response = await fetch(`${this.getBaseUrl()}/blog-authors?${searchParams}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch blog authors");
    }

    const json = await response.json();
    const normalizedData = Array.isArray(json.data)
      ? json.data.map((item: any) => this.normalizeBlogAuthor(item)).filter(Boolean)
      : [];

    return {
      data: normalizedData as BlogAuthor[],
      meta: json.meta,
    };
  }

  // Create blog author (authenticated)
  async createBlogAuthor(data: CreateBlogAuthorData): Promise<ApiResponse<BlogAuthor>> {
    const response = await fetch(`${this.getBaseUrl()}/blog-authors`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to create blog author");
    }

    const json = await response.json();
    return {
      data: this.normalizeBlogAuthor(json.data) as BlogAuthor,
      meta: json.meta,
    };
  }

  // Update blog author (authenticated)
  async updateBlogAuthor(id: number, data: Partial<CreateBlogAuthorData>): Promise<ApiResponse<BlogAuthor>> {
    const response = await fetch(`${this.getBaseUrl()}/blog-authors/${id}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to update blog author");
    }

    const json = await response.json();
    return {
      data: this.normalizeBlogAuthor(json.data) as BlogAuthor,
      meta: json.meta,
    };
  }

  // Delete blog author (authenticated)
  async deleteBlogAuthor(id: number): Promise<void> {
    const response = await fetch(`${this.getBaseUrl()}/blog-authors/${id}`, {
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
    searchParams.append("populate[user][populate][user_info]", "*");
    searchParams.append("populate[parent_comment]", "*");
    searchParams.append("populate[replies][populate][user]", "*");
    searchParams.append("populate[replies][populate][user][populate][user_info]", "*");

    const response = await fetch(`${this.getBaseUrl()}/blog-comments/post/${postId}?${searchParams}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch blog comments");
    }

    const json = await response.json();
    const normalized = Array.isArray(json.data)
      ? json.data.map((item: any) => this.normalizeBlogComment(item)).filter(Boolean)
      : [];

    return { data: normalized, meta: json.meta };
  }

  // Get all comments (admin)
  async getAllBlogComments(params: { status?: string; page?: number; pageSize?: number } = {}): Promise<PaginatedResponse<BlogComment>> {
    const searchParams = new URLSearchParams();
    searchParams.append("pagination[page]", (params.page || 1).toString());
    searchParams.append("pagination[pageSize]", (params.pageSize || 20).toString());
    searchParams.append("sort", "createdAt:desc");
    searchParams.append("populate[user][populate][user_info]", "*");
    searchParams.append("populate[blog_post]", "*");
    searchParams.append("populate[parent_comment]", "*");

    if (params.status) {
      searchParams.append("filters[Status][$eq]", params.status);
    }

    const response = await fetch(`${this.getBaseUrl()}/blog-comments?${searchParams}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch blog comments");
    }

    const json = await response.json();
    const normalized = Array.isArray(json.data)
      ? json.data.map((item: any) => this.normalizeBlogComment(item)).filter(Boolean)
      : [];

    return { data: normalized, meta: json.meta };
  }

  // Create comment (authenticated)
  async createBlogComment(
    postId: number,
    content: string,
    parentCommentId?: number
  ): Promise<ApiResponse<BlogComment>> {
    const response = await fetch(`${this.getBaseUrl()}/blog-comments`, {
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

    const json = await response.json();
    return { data: this.normalizeBlogComment(json.data), meta: json.meta };
  }

  // Update comment status (admin)
  async updateBlogCommentStatus(id: number, status: "Pending" | "Approved" | "Rejected"): Promise<ApiResponse<BlogComment>> {
    const response = await fetch(`${this.getBaseUrl()}/blog-comments/${id}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify({ data: { Status: status } }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to update comment status");
    }

    const json = await response.json();
    return { data: this.normalizeBlogComment(json.data), meta: json.meta };
  }

  // Delete comment (admin)
  async deleteBlogComment(id: number): Promise<void> {
    const response = await fetch(`${this.getBaseUrl()}/blog-comments/${id}`, {
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
