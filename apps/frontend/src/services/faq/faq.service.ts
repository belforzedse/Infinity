import { ApiResponse, PaginatedResponse } from "@/types/api";
import { API_BASE_URL, getStrapiServerUrl } from "@/constants/api";
import { FAQCategory, FAQQuestion } from "@/types/faq";
import logger from "@/utils/logger";

class FAQService {
  private getBaseUrl(): string {
    return typeof window === "undefined" ? getStrapiServerUrl() : API_BASE_URL;
  }

  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  private unwrapRelation(rel: any): { id: number; [key: string]: any } | undefined {
    if (!rel?.data) return undefined;
    return { id: rel.data.id, ...(rel.data.attributes || {}) };
  }

  private normalizeFAQCategory(entry: any): FAQCategory | undefined {
    if (!entry) return undefined;
    const relation = this.unwrapRelation(entry);
    const source = relation?.attributes || relation || entry?.attributes || entry;
    if (!source) return undefined;

    const questions = source.faq_questions?.data
      ? source.faq_questions.data.map((q: any) => this.normalizeFAQQuestion(q)).filter(Boolean)
      : Array.isArray(source.faq_questions)
        ? source.faq_questions.map((q: any) => this.normalizeFAQQuestion(q)).filter(Boolean)
        : [];

    return {
      id: source.id ?? entry.id ?? relation?.id,
      Title: source.Title || source.title || "",
      Slug: source.Slug || source.slug || "",
      Description: source.Description || source.description,
      Order: source.Order || source.order || 0,
      faq_questions: questions.length > 0 ? questions : undefined,
      createdAt: source.createdAt || entry.createdAt,
      updatedAt: source.updatedAt || entry.updatedAt,
    };
  }

  private normalizeFAQQuestion(entry: any): FAQQuestion | undefined {
    if (!entry) return undefined;
    const relation = this.unwrapRelation(entry);
    const source = relation?.attributes || relation || entry?.attributes || entry;
    if (!source) return undefined;

    return {
      id: source.id ?? entry.id ?? relation?.id,
      Question: source.Question || source.question || "",
      Answer: source.Answer || source.answer || "",
      Order: source.Order || source.order || 0,
      IsActive: source.IsActive !== undefined ? source.IsActive : source.isActive !== undefined ? source.isActive : true,
      faq_category: source.faq_category
        ? this.normalizeFAQCategory(source.faq_category)
        : undefined,
      createdAt: source.createdAt || entry.createdAt,
      updatedAt: source.updatedAt || entry.updatedAt,
    };
  }

  // Get all FAQ categories with questions (public)
  async getFAQCategories(includeInactive = false): Promise<ApiResponse<FAQCategory[]>> {
    const baseUrl = this.getBaseUrl();
    const searchParams = new URLSearchParams();

    // Populate questions - filter only active questions unless includeInactive is true
    if (!includeInactive) {
      searchParams.append("populate[faq_questions][filters][IsActive][$eq]", "true");
    }
    searchParams.append("populate[faq_questions][sort]", "Order:asc");
    searchParams.append("sort", "Order:asc");

    const url = `${baseUrl}/faq-categories?${searchParams}`;

    if (typeof window === "undefined") {
      logger.info("[FAQService] Fetching FAQ categories", { url: url.replace(baseUrl, "[BASE_URL]") });
    }

    const response = await fetch(url, {
      headers: this.getHeaders(),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      logger.error("[FAQService] Failed to fetch FAQ categories", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(`Failed to fetch FAQ categories: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();

    // Normalize Strapi response format
    const data = Array.isArray(json.data)
      ? json.data.map((item: any) => this.normalizeFAQCategory(item)).filter(Boolean) as FAQCategory[]
      : json.data
        ? [this.normalizeFAQCategory(json.data)].filter(Boolean) as FAQCategory[]
        : [];

    return { data, meta: json.meta };
  }

  // Get single FAQ category by slug with questions (public)
  async getFAQCategoryBySlug(slug: string): Promise<ApiResponse<FAQCategory>> {
    const baseUrl = this.getBaseUrl();
    const searchParams = new URLSearchParams();

    searchParams.append("filters[Slug][$eq]", slug);
    searchParams.append("populate[faq_questions][filters][IsActive][$eq]", "true");
    searchParams.append("populate[faq_questions][sort]", "Order:asc");

    const url = `${baseUrl}/faq-categories?${searchParams}`;

    if (typeof window === "undefined") {
      logger.info("[FAQService] Fetching FAQ category by slug", {
        slug,
        url: url.replace(baseUrl, "[BASE_URL]"),
      });
    }

    const response = await fetch(url, {
      headers: this.getHeaders(),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      logger.error("[FAQService] Failed to fetch FAQ category", {
        slug,
        status: response.status,
        error: errorText,
      });
      throw new Error(`Failed to fetch FAQ category: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();

    if (!json.data || (Array.isArray(json.data) && json.data.length === 0)) {
      throw new Error(`FAQ category with slug "${slug}" not found`);
    }

    const categoryData = Array.isArray(json.data) ? json.data[0] : json.data;
    const normalized = this.normalizeFAQCategory(categoryData);

    if (!normalized) {
      throw new Error(`Failed to normalize FAQ category data`);
    }

    return { data: normalized, meta: json.meta };
  }

  // Get FAQ questions (optionally filtered by category)
  async getFAQQuestions(categoryId?: number): Promise<ApiResponse<FAQQuestion[]>> {
    const baseUrl = this.getBaseUrl();
    const searchParams = new URLSearchParams();

    searchParams.append("filters[IsActive][$eq]", "true");
    searchParams.append("sort", "Order:asc");

    if (categoryId) {
      searchParams.append("filters[faq_category][id][$eq]", categoryId.toString());
    }

    searchParams.append("populate[faq_category]", "*");

    const url = `${baseUrl}/faq-questions?${searchParams}`;

    const response = await fetch(url, {
      headers: this.getHeaders(),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      logger.error("[FAQService] Failed to fetch FAQ questions", {
        categoryId,
        status: response.status,
        error: errorText,
      });
      throw new Error(`Failed to fetch FAQ questions: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();

    const data = Array.isArray(json.data)
      ? json.data.map((item: any) => this.normalizeFAQQuestion(item)).filter(Boolean) as FAQQuestion[]
      : json.data
        ? [this.normalizeFAQQuestion(json.data)].filter(Boolean) as FAQQuestion[]
        : [];

    return { data, meta: json.meta };
  }
}

export const faqService = new FAQService();
export default faqService;
