const { WordPressClient, StrapiClient, WooCommerceClient } = require("../utils/ApiClient");
const DuplicateTracker = require("../utils/DuplicateTracker");
const ImageUploader = require("../utils/ImageUploader");
const ProductImporter = require("./ProductImporter");
const VariationImporter = require("./VariationImporter");

/**
 * Blog Post Importer - Imports WordPress posts (plus categories, tags, authors, media) into Strapi.
 * - Dependency-aware: ensures categories/tags/authors/media exist before creating posts
 * - Idempotent: uses slug lookups + mapping files to update instead of duplicating
 * - Resilient: logs and continues when a related entity fails (especially authors)
 */
class BlogPostImporter {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.wpClient = new WordPressClient(config, logger);
    this.strapiClient = new StrapiClient(config, logger);
    this.wooClient = new WooCommerceClient(config, logger);
    this.duplicateTracker = new DuplicateTracker(config, logger);
    this.imageUploader = new ImageUploader(config, logger);
    this.productImporter = new ProductImporter(config, logger);
    this.variationImporter = new VariationImporter(config, logger);

    this.categoryCache = new Map();
    this.tagCache = new Map();
    this.tagNameCache = new Map();
    this.authorCache = new Map();
    this.mediaCache = new Map();

    this.stats = {
      total: 0,
      success: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: 0,
      startTime: null,
      endTime: null,
    };

    // Base URL for media links (strip trailing /api if present)
    this.strapiMediaBase = (this.config.strapi.baseUrl || "")
      .replace(/\/api\/?$/, "")
      .replace(/\/$/, "");
    // Frontend blog base path for internal links (empty -> "/<slug>")
    this.blogBasePath = "";
    // WordPress base host for internal link detection
    try {
      const wpUrl = new URL(config.wordpress.baseUrl);
      this.wpHost = wpUrl.host;
    } catch {
      this.wpHost = null;
    }
  }

  /**
   * Main import entry point
   */
  async import(options = {}) {
    const {
      limit = 50,
      page = 1,
      batchSize = this.config.import.batchSizes.blogPosts || 20,
      status = "publish",
      after = null,
      dryRun = false,
    } = options;

    this.stats.startTime = Date.now();
    this.logger.info(
      `📰 Starting blog post import (limit: ${limit}, page: ${page}, status: ${status}, dryRun: ${dryRun})`,
    );

    let currentPage = page;
    let processed = 0;
    let progressStarted = false;

    while (processed < limit) {
      const perPage = Math.min(batchSize, limit - processed);
      const result = await this.wpClient.getPosts(currentPage, perPage, { status, after });

      if (!result.data || result.data.length === 0) {
        if (!progressStarted) {
          this.logger.warn("📭 No blog posts found to import");
        } else {
          this.logger.info(`📄 No posts found on page ${currentPage}`);
        }
        break;
      }

      if (!progressStarted) {
        const targetTotal = Math.min(result.totalItems || limit, limit);
        this.stats.total = targetTotal;
        this.logger.startProgress(targetTotal, "Importing blog posts");
        progressStarted = true;
      }

      for (const wpPost of result.data) {
        try {
          await this.importSinglePost(wpPost, { dryRun });
        } catch (error) {
          this.stats.errors++;
          this.stats.failed++;
          this.logger.error(
            `❌ Failed to import post ${wpPost.id} (${this.decodeText(wpPost.title?.rendered)}):`,
            error.message,
          );
          if (!this.config.errorHandling.continueOnError) {
            throw error;
          }
        } finally {
          processed++;
          this.logger.updateProgress();
        }

        if (processed >= limit) {
          break;
        }
      }

      currentPage++;
      if (currentPage > result.totalPages) {
        break;
      }
    }

    if (progressStarted) {
      this.logger.completeProgress();
    }

    this.stats.total = processed;
    this.stats.endTime = Date.now();
    this.stats.duration = this.stats.endTime - this.stats.startTime;
    this.logFinalStats();

    return this.stats;
  }

  /**
   * Import a single WordPress post (ensures dependencies first)
   */
  async importSinglePost(wpPost, { dryRun = false } = {}) {
    const title = this.decodeText(wpPost.title?.rendered || `WordPress Post ${wpPost.id}`);
    const slug = this.normalizeSlug(wpPost.slug, title);
    this.logger.debug(`📝 Processing post ${wpPost.id}: ${title}`);

    // Resolve related entities up front
    const categoryId = await this.ensureCategory(wpPost.categories?.[0], dryRun);
    const { ids: tagIds, names: tagNames } = await this.ensureTags(wpPost.tags || [], dryRun);
    const authorId = await this.ensureAuthor(wpPost, dryRun);
    const featuredImageId = await this.ensureFeaturedImage(wpPost, dryRun);

    const status = this.mapStatus(wpPost.status);
    const excerpt = this.buildExcerpt(wpPost.excerpt?.rendered);
    const metaDescription = this.buildMetaDescription(wpPost, excerpt);
    const publishedAt = this.resolvePublishedAt(wpPost, status);

    const payload = {
      Title: title,
      Slug: slug,
      Content: await this.rewriteContentLinks(
        await this.rewriteContentCarousels(
          await this.rewriteContentImages(wpPost.content?.rendered || excerpt || title),
          dryRun,
        ),
      ),
      Excerpt: excerpt,
      MetaTitle: this.truncate(title, 60),
      MetaDescription: metaDescription,
      Keywords: tagNames.length > 0 ? this.truncate(tagNames.join(", "), 200) : undefined,
      Status: status,
      PublishedAt: publishedAt,
      ViewCount: Number.parseInt(wpPost.view_count || wpPost.meta?.view_count || 0, 10) || 0,
    };

    if (categoryId) {
      payload.blog_category = categoryId;
    }
    if (tagIds.length > 0) {
      payload.blog_tags = tagIds;
    }
    if (authorId) {
      payload.blog_author = authorId;
    }
    if (featuredImageId) {
      payload.FeaturedImage = featuredImageId;
    }

    // Try to locate an existing record (mapping first, slug fallback)
    const mapping = this.duplicateTracker.getStrapiId("blogPosts", wpPost.id);
    let existingPostId = mapping?.strapiId || mapping;

    if (!existingPostId) {
      const existingBySlug = await this.strapiClient.findBlogPostBySlug(slug);
      existingPostId = this.extractId(existingBySlug);
      if (existingPostId) {
        this.logger.info(
          `🔁 Found existing post by slug "${slug}" → ID ${existingPostId}, will update`,
        );
        this.duplicateTracker.recordMapping("blogPosts", wpPost.id, existingPostId, {
          slug,
          syncedFromExisting: true,
        });
      }
    }

    if (dryRun) {
      this.stats.success++;
      this.logger.info(`🔍 [DRY RUN] Would ${existingPostId ? "update" : "create"} post: ${title}`);
      return null;
    }

    let result;
    if (existingPostId) {
      result = await this.strapiClient.updateBlogPost(existingPostId, payload);
      this.stats.updated++;
      this.logger.debug(`✅ Updated post ${title} (ID ${existingPostId})`);
    } else {
      result = await this.strapiClient.createBlogPost(payload);
      this.stats.success++;
      existingPostId = this.extractId(result);
      this.logger.debug(`✅ Created post ${title} (ID ${existingPostId})`);
    }

    const savedId = this.extractId(result) || existingPostId;
    if (savedId) {
      this.duplicateTracker.recordMapping("blogPosts", wpPost.id, savedId, {
        slug,
        status,
        importedSlug: slug,
      });
    }

    return result;
  }

  /**
   * Ensure a Strapi blog category exists for the given WordPress category ID
   */
  async ensureCategory(categoryId, dryRun = false) {
    if (!categoryId) {
      return null;
    }

    if (this.categoryCache.has(categoryId)) {
      return this.categoryCache.get(categoryId);
    }

    const mapped = this.duplicateTracker.getStrapiId("blogCategories", categoryId);
    if (mapped?.strapiId || typeof mapped === "number") {
      const strapiId = mapped.strapiId || mapped;
      this.categoryCache.set(categoryId, strapiId);
      return strapiId;
    }

    let wpCategory;
    try {
      wpCategory = await this.wpClient.getCategory(categoryId);
    } catch (error) {
      this.logger.warn(`⚠️ Failed to fetch WordPress category ${categoryId}: ${error.message}`);
      return null;
    }

    const slug = this.normalizeSlug(wpCategory.slug, wpCategory.name);
    const payload = {
      Title: this.decodeText(wpCategory.name || `Category ${categoryId}`),
      Slug: slug,
      Description: this.decodeText(wpCategory.description || ""),
    };

    const existing = await this.strapiClient.findBlogCategoryBySlug(slug);
    let strapiId = this.extractId(existing);

    if (existing) {
      this.logger.debug(`🔗 Using existing blog category "${slug}" (ID ${strapiId})`);
    } else if (!dryRun) {
      const created = await this.strapiClient.createBlogCategory(payload);
      strapiId = this.extractId(created);
      this.logger.debug(`✅ Created blog category "${slug}" (ID ${strapiId})`);
    } else {
      this.logger.info(`🔍 [DRY RUN] Would create blog category "${payload.Title}"`);
    }

    if (strapiId) {
      this.categoryCache.set(categoryId, strapiId);
      this.duplicateTracker.recordMapping("blogCategories", categoryId, strapiId, { slug });
    }

    return strapiId || null;
  }

  /**
   * Ensure all Strapi tags exist for given WordPress tag IDs
   */
  async ensureTags(tagIds = [], dryRun = false) {
    const strapiIds = [];
    const tagNames = [];

    for (const wpTagId of tagIds) {
      if (!wpTagId) continue;

      if (this.tagCache.has(wpTagId)) {
        strapiIds.push(this.tagCache.get(wpTagId));
        const cachedName =
          this.tagNameCache.get(wpTagId) || (await this.fetchAndCacheTagName(wpTagId));
        if (cachedName) {
          tagNames.push(cachedName);
        }
        continue;
      }

      const mapped = this.duplicateTracker.getStrapiId("blogTags", wpTagId);
      if (mapped?.strapiId || typeof mapped === "number") {
        const strapiId = mapped.strapiId || mapped;
        this.tagCache.set(wpTagId, strapiId);
        strapiIds.push(strapiId);
        const cachedName =
          this.tagNameCache.get(wpTagId) || (await this.fetchAndCacheTagName(wpTagId));
        if (cachedName) {
          tagNames.push(cachedName);
        }
        continue;
      }

      let wpTag;
      try {
        wpTag = await this.wpClient.getTag(wpTagId);
      } catch (error) {
        this.logger.warn(`⚠️ Failed to fetch WordPress tag ${wpTagId}: ${error.message}`);
        continue;
      }

      const slug = this.normalizeSlug(wpTag.slug, wpTag.name);
      const payload = {
        Name: this.decodeText(wpTag.name || `Tag ${wpTagId}`),
        Slug: slug,
        Description: this.decodeText(wpTag.description || "") || undefined,
      };
      if (payload.Name) {
        this.tagNameCache.set(wpTagId, payload.Name);
      }

      const existing = await this.strapiClient.findBlogTagBySlug(slug);
      let strapiId = this.extractId(existing);

      if (existing) {
        this.logger.debug(`🔗 Using existing blog tag "${slug}" (ID ${strapiId})`);
      } else if (!dryRun) {
        const created = await this.strapiClient.createBlogTag(payload);
        strapiId = this.extractId(created);
        this.logger.debug(`✅ Created blog tag "${slug}" (ID ${strapiId})`);
      } else {
        this.logger.info(`🔍 [DRY RUN] Would create blog tag "${payload.Name}"`);
      }

      if (strapiId) {
        this.tagCache.set(wpTagId, strapiId);
        if (payload.Name) {
          this.tagNameCache.set(wpTagId, payload.Name);
        }
        strapiIds.push(strapiId);
        this.duplicateTracker.recordMapping("blogTags", wpTagId, strapiId, { slug });
      }

      if (payload.Name) {
        tagNames.push(payload.Name);
      }
    }

    return { ids: [...new Set(strapiIds)], names: tagNames };
  }

  /**
   * Ensure a blog author exists; tolerate failures gracefully
   */
  async ensureAuthor(wpPost, dryRun = false) {
    const authorId = wpPost.author;
    if (!authorId) {
      return null;
    }

    if (this.authorCache.has(authorId)) {
      return this.authorCache.get(authorId);
    }

    const mapped = this.duplicateTracker.getStrapiId("blogAuthors", authorId);
    if (mapped?.strapiId || typeof mapped === "number") {
      const strapiId = mapped.strapiId || mapped;
      this.authorCache.set(authorId, strapiId);
      return strapiId;
    }

    let wpAuthor = this.extractEmbeddedAuthor(wpPost);
    if (!wpAuthor) {
      try {
        wpAuthor = await this.wpClient.getUser(authorId);
      } catch (error) {
        this.logger.warn(`⚠️ Failed to fetch WordPress author ${authorId}: ${error.message}`);
      }
    }

    if (!wpAuthor) {
      this.logger.warn(
        `⚠️ Skipping author linkage for post ${wpPost.id} (author ${authorId} unavailable)`,
      );
      return null;
    }

    const authorName =
      this.decodeText(wpAuthor.name || wpAuthor.username || `Author ${authorId}`) ||
      `author-${authorId}`;
    const authorEmail = wpAuthor.email || null;
    const authorBio = this.decodeText(wpAuthor.description || "");

    const existing = await this.strapiClient.findBlogAuthorByEmailOrName(authorEmail, authorName);
    let strapiAuthorId = this.extractId(existing);

    const avatarUrl =
      wpAuthor.avatar_urls?.["192"] ||
      wpAuthor.avatar_urls?.["96"] ||
      wpAuthor.avatar_urls?.["48"] ||
      null;
    const avatarId = await this.ensureMediaUpload(
      { url: avatarUrl, alt: `${authorName} avatar` },
      this.buildMediaMappingKey({ id: `author-avatar-${authorId}`, url: avatarUrl }),
      dryRun,
    );

    // Try to link to an existing plugin user; failure should not block import
    const pluginUserId = await this.findExistingPluginUserId(authorEmail);

    const payload = {
      Name: authorName,
      Email: authorEmail || undefined,
      Bio: authorBio || undefined,
    };
    if (avatarId) {
      payload.Avatar = avatarId;
    }
    if (pluginUserId) {
      payload.users_permissions_user = pluginUserId;
    }

    if (existing) {
      if (!dryRun) {
        await this.strapiClient.updateBlogAuthor(strapiAuthorId, payload);
        this.logger.debug(`🔗 Updated existing blog author "${authorName}" (ID ${strapiAuthorId})`);
      } else {
        this.logger.info(`🔍 [DRY RUN] Would update blog author "${authorName}"`);
      }
    } else if (!dryRun) {
      const created = await this.strapiClient.createBlogAuthor(payload);
      strapiAuthorId = this.extractId(created);
      this.logger.debug(`✅ Created blog author "${authorName}" (ID ${strapiAuthorId})`);
    } else {
      this.logger.info(`🔍 [DRY RUN] Would create blog author "${authorName}"`);
    }

    if (strapiAuthorId) {
      this.authorCache.set(authorId, strapiAuthorId);
      this.duplicateTracker.recordMapping("blogAuthors", authorId, strapiAuthorId, {
        email: authorEmail,
      });
    }

    return strapiAuthorId || null;
  }

  /**
   * Ensure featured media is uploaded and mapped
   */
  async ensureFeaturedImage(wpPost, dryRun = false) {
    let mediaInfo = this.extractFeaturedMedia(wpPost);
    if (mediaInfo && !mediaInfo.url && mediaInfo.id) {
      try {
        const wpMedia = await this.wpClient.getMedia(mediaInfo.id);
        mediaInfo = {
          id: mediaInfo.id,
          url: wpMedia?.source_url,
          alt: wpMedia?.alt_text || wpMedia?.title?.rendered || wpPost.title?.rendered,
          title: wpMedia?.title?.rendered,
        };
      } catch (error) {
        this.logger.warn(
          `⚠️ Failed to fetch featured media ${mediaInfo.id} for post ${wpPost.id}: ${error.message}`,
        );
      }
    }

    if (!mediaInfo || !mediaInfo.url) {
      return null;
    }

    const cacheKey = this.buildMediaMappingKey(mediaInfo, `post-${wpPost.id}-featured`);
    return this.ensureMediaUpload(mediaInfo, cacheKey, dryRun);
  }

  /**
   * Upload media if needed and return Strapi media ID (idempotent via mapping)
   */
  async ensureMediaUpload(mediaInfo, cacheKey, dryRun = false) {
    if (!mediaInfo?.url) {
      return null;
    }

    const key = cacheKey || this.buildMediaMappingKey(mediaInfo);
    if (!key) {
      return null;
    }

    if (this.mediaCache.has(key)) {
      return this.mediaCache.get(key);
    }

    const mapped = this.duplicateTracker.getStrapiId("blogMedia", key);
    if (mapped?.strapiId || typeof mapped === "number") {
      const strapiId = mapped.strapiId || mapped;
      this.mediaCache.set(key, { id: strapiId, url: mapped?.uploadedUrl });
      return { id: strapiId, url: mapped?.uploadedUrl };
    }

    if (dryRun) {
      this.logger.info(`🔍 [DRY RUN] Would upload media ${mediaInfo.url}`);
      return null;
    }

    const prefix =
      key
        .toString()
        .replace(/[^a-z0-9-]/gi, "-")
        .substring(0, 50) || "blog-media";
    const uploaded = await this.imageUploader.downloadAndUploadImage(
      mediaInfo.url,
      mediaInfo.alt || mediaInfo.title || "Blog media",
      prefix,
    );

    const uploadedId = this.extractId(uploaded);
    const uploadedUrl = uploaded?.url || uploaded?.urlPath || null;
    if (uploadedId) {
      this.mediaCache.set(key, { id: uploadedId, url: uploadedUrl });
      this.duplicateTracker.recordMapping("blogMedia", key, uploadedId, {
        url: mediaInfo.url,
        uploadedUrl,
      });
      return { id: uploadedId, url: uploadedUrl };
    }

    return null;
  }

  /**
   * Helpers & transforms
   */
  extractFeaturedMedia(wpPost) {
    const embeddedMedia = wpPost._embedded?.["wp:featuredmedia"]?.[0];
    if (embeddedMedia && embeddedMedia.source_url) {
      return {
        id: embeddedMedia.id || wpPost.featured_media,
        url: embeddedMedia.source_url,
        alt: embeddedMedia.alt_text || embeddedMedia.title?.rendered || wpPost.title?.rendered,
        title: embeddedMedia.title?.rendered,
      };
    }

    if (wpPost.featured_media) {
      return { id: wpPost.featured_media };
    }

    return null;
  }

  extractEmbeddedAuthor(wpPost) {
    return wpPost._embedded?.author?.[0] || null;
  }

  async fetchAndCacheTagName(tagId) {
    try {
      const wpTag = await this.wpClient.getTag(tagId);
      const name = this.decodeText(wpTag?.name || `Tag ${tagId}`);
      if (name) {
        this.tagNameCache.set(tagId, name);
      }
      return name;
    } catch (error) {
      this.logger.debug(`⚠️ Failed to fetch tag name for ${tagId}: ${error.message}`);
      return null;
    }
  }

  async findExistingPluginUserId(email) {
    if (!email) return null;
    try {
      const user = await this.strapiClient.findPluginUserByEmail(email);
      return this.extractId(user);
    } catch (error) {
      this.logger.warn(`⚠️ Failed to lookup plugin user for ${email}: ${error.message}`);
      return null;
    }
  }

  mapStatus(wpStatus) {
    const map = {
      publish: "Published",
      future: "Scheduled",
      draft: "Draft",
      pending: "Draft",
      private: "Draft",
    };
    return map[wpStatus] || "Draft";
  }

  resolvePublishedAt(wpPost, mappedStatus) {
    if (mappedStatus === "Published" || mappedStatus === "Scheduled") {
      return wpPost.date_gmt || wpPost.date || null;
    }
    return null;
  }

  buildExcerpt(html = "") {
    const cleaned = this.stripHtml(html);
    return this.truncate(cleaned, 500);
  }

  buildMetaDescription(wpPost, fallbackExcerpt) {
    const yoastDescription =
      wpPost.yoast_head_json?.description || wpPost.yoast_head_json?.og_description;
    if (yoastDescription) {
      return this.truncate(this.decodeText(yoastDescription), 160);
    }
    return this.truncate(fallbackExcerpt || this.stripHtml(wpPost.content?.rendered || ""), 160);
  }

  normalizeSlug(slug, title) {
    // First, try to use the provided slug if available
    if (slug && slug.trim()) {
      // Decode URL-encoded or hex-encoded Persian slugs
      let decodedSlug = slug;
      try {
        // Try URL decoding first (handles %D8%A2... format)
        decodedSlug = decodeURIComponent(slug);
      } catch (e) {
        // If URL decoding fails, try hex decoding (handles d8a2... format)
        try {
          // Check if it looks like hex-encoded (only hex chars, even length)
          if (/^[0-9a-f]+$/i.test(slug) && slug.length % 2 === 0) {
            decodedSlug = Buffer.from(slug, "hex").toString("utf-8");
          }
        } catch (e2) {
          // If both fail, use as-is
        }
      }

      // Clean and normalize the slug
      const cleanedSlug = this.cleanSlug(decodedSlug);
      if (cleanedSlug) {
        return cleanedSlug;
      }
    }

    // Fallback: generate slug from title
    if (title && title.trim()) {
      const generatedSlug = this.generateSlugFromTitle(title);
      return generatedSlug;
    }

    // Last resort: use timestamp
    return `wp-post-${Date.now()}`;
  }

  /**
   * Generate a slug from a title
   * Supports Persian/Arabic characters
   * @param {string} title - Title text
   * @returns {string} - Generated slug
   */
  generateSlugFromTitle(title) {
    if (!title) {
      return `wp-post-${Date.now()}`;
    }

    // First, replace spaces and ZWNJ with hyphens
    let slug = title
      .toString()
      .trim()
      .replace(/[\s\u200c]+/g, "-"); // Convert spaces and ZWNJ to hyphen

    // Lowercase only ASCII letters (a-z), preserve Persian characters
    slug = slug.replace(/[A-Z]/g, (char) => char.toLowerCase());

    // Remove unwanted characters but keep ASCII letters/numbers, Persian letters, and hyphens
    slug = slug.replace(/[^0-9a-z\u0600-\u06ff-]/gi, "");

    // Collapse multiple hyphens
    slug = slug.replace(/-+/g, "-");

    // Trim leading/trailing hyphens
    slug = slug.replace(/^-|-$/g, "");

    return slug || `wp-post-${Date.now()}`;
  }

  /**
   * Clean and normalize a slug
   * Preserves Persian/Arabic characters
   * @param {string} slug - Slug to clean
   * @returns {string} - Cleaned slug
   */
  cleanSlug(slug) {
    if (!slug) return "";

    // First, replace spaces and ZWNJ with hyphens
    let cleaned = slug
      .toString()
      .trim()
      .replace(/[\s\u200c]+/g, "-"); // Convert spaces and ZWNJ to hyphen

    // Lowercase only ASCII letters (a-z), preserve Persian characters
    cleaned = cleaned.replace(/[A-Z]/g, (char) => char.toLowerCase());

    // Remove unwanted characters but keep ASCII letters/numbers, Persian letters, and hyphens
    cleaned = cleaned.replace(/[^0-9a-z\u0600-\u06ff-]/gi, "");

    // Collapse multiple hyphens
    cleaned = cleaned.replace(/-+/g, "-");

    // Trim leading/trailing hyphens
    cleaned = cleaned.replace(/^-|-$/g, "");

    return cleaned;
  }

  slugify(value) {
    // Deprecated: use generateSlugFromTitle instead
    return this.generateSlugFromTitle(value);
  }

  stripHtml(html) {
    return this.decodeText(html || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  decodeText(text) {
    if (!text) return "";
    return text
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#8217;/g, "'")
      .replace(/&#8211;/g, "-")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&#8230;/g, "...")
      .trim();
  }

  truncate(text, max = 160) {
    if (!text) return "";
    const value = text.toString();
    return value.length > max ? `${value.slice(0, max - 3).trim()}...` : value;
  }

  buildMediaMappingKey(mediaInfo, fallback) {
    if (!mediaInfo) return fallback || null;
    if (mediaInfo.id) return `wp-media:${mediaInfo.id}`;
    if (mediaInfo.url) return `url:${mediaInfo.url}`;
    return fallback || null;
  }

  /**
   * Rewrite image URLs in post content by uploading them to Strapi and replacing src attributes.
   */
  async rewriteContentImages(html) {
    if (!html || typeof html !== "string") {
      return html;
    }

    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const sources = new Set();
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      if (match[1]) {
        sources.add(match[1]);
      }
    }

    if (sources.size === 0) {
      return html;
    }

    let rewritten = html;
    for (const src of sources) {
      try {
        const cacheKey = this.buildMediaMappingKey({ url: src }) || `url:${src}`;
        let uploaded = this.mediaCache.get(cacheKey);

        if (!uploaded) {
          const mapped = this.duplicateTracker.getStrapiId("blogMedia", cacheKey);
          if (mapped?.strapiId || typeof mapped === "number") {
            uploaded = { id: mapped.strapiId || mapped, url: mapped?.uploadedUrl };
            this.mediaCache.set(cacheKey, uploaded);
          }
        }

        if (!uploaded) {
          uploaded = await this.ensureMediaUpload(
            { url: src, alt: "Content image" },
            cacheKey,
            false,
          );
        }

        const newUrl = this.normalizeMediaUrl(uploaded?.url);
        if (uploaded?.id && newUrl) {
          const escaped = src.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const srcRegex = new RegExp(escaped, "g");
          rewritten = rewritten.replace(srcRegex, newUrl);
        }
      } catch (error) {
        this.logger.warn(`⚠️ Failed to rewrite image ${src}: ${error.message}`);
      }
    }

    return rewritten;
  }

  /**
   * Rewrite internal blog links from WordPress domain to our frontend blog structure.
   */
  async rewriteContentLinks(html) {
    if (!html || typeof html !== "string") {
      return html;
    }

    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
    const sources = new Set();
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      if (match[1]) {
        sources.add(match[1]);
      }
    }

    if (sources.size === 0) {
      return html;
    }

    let rewritten = html;
    for (const href of sources) {
      try {
        const newHref = this.rewriteSingleLink(href);
        if (newHref && newHref !== href) {
          const escaped = href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const hrefRegex = new RegExp(escaped, "g");
          rewritten = rewritten.replace(hrefRegex, newHref);
        }
      } catch (error) {
        this.logger.debug(`⚠️ Failed to rewrite link ${href}: ${error.message}`);
      }
    }

    return rewritten;
  }

  rewriteSingleLink(href) {
    try {
      // First, check if it's a WordPress product or shop URL
      const convertedUrl = this.convertWordPressUrlToStrapi(href);
      if (convertedUrl && convertedUrl !== href) {
        return convertedUrl;
      }

      const url = new URL(href, this.wpHost ? `https://${this.wpHost}` : undefined);
      const isInternal =
        (this.wpHost && url.host === this.wpHost) || (!url.host && href.startsWith("/"));

      if (!isInternal) {
        return href;
      }

      const wpId = this.extractWpPostId(url);
      const wpSlug = this.extractSlugFromPath(url.pathname);
      const mappedSlug = this.getMappedSlug(wpId, wpSlug);

      if (!mappedSlug) {
        return href;
      }

      // If blogBasePath is empty, use "/<slug>"
      return `${this.blogBasePath}/${mappedSlug}`.replace(/\/+/g, "/");
    } catch {
      // If parsing fails, leave the link untouched
      return href;
    }
  }

  /**
   * Convert WordPress URLs to Strapi format
   * product/[slug] → pdp/[slug]
   * shop/[slug] → plp?category=[slug]
   */
  convertWordPressUrlToStrapi(url) {
    if (!url || typeof url !== "string") {
      return url;
    }

    try {
      // Product URL: https://infinitycolor.co/product/[slug]/ → /pdp/[slug]
      if (url.includes("/product/")) {
        const slug = this.extractSlugFromWordPressProductUrl(url);
        if (slug) {
          return `/pdp/${slug}`;
        }
      }

      // Category URL: https://infinitycolor.co/shop/[slug]/ → /plp?category=[slug]
      if (url.includes("/shop/")) {
        const slug = this.extractSlugFromWordPressCategoryUrl(url);
        if (slug) {
          return `/plp?category=${encodeURIComponent(slug)}`;
        }
      }
    } catch (error) {
      this.logger.debug(`⚠️ Failed to convert WordPress URL ${url}: ${error.message}`);
    }

    return url; // No conversion needed
  }

  /**
   * Extract slug from WordPress product URL
   * Handles URL-encoded Persian slugs
   */
  extractSlugFromWordPressProductUrl(url) {
    if (!url || typeof url !== "string") {
      return null;
    }

    try {
      // Match /product/[slug]/ pattern
      const match = url.match(/\/product\/([^\/\?#]+)/);
      if (match && match[1]) {
        // Decode URL-encoded slug
        try {
          return decodeURIComponent(match[1]);
        } catch {
          return match[1];
        }
      }
    } catch (error) {
      this.logger.debug(`⚠️ Failed to extract product slug from ${url}: ${error.message}`);
    }

    return null;
  }

  /**
   * Extract slug from WordPress category URL
   * Handles URL-encoded slugs
   */
  extractSlugFromWordPressCategoryUrl(url) {
    if (!url || typeof url !== "string") {
      return null;
    }

    try {
      // Match /shop/[slug]/ pattern
      const match = url.match(/\/shop\/([^\/\?#]+)/);
      if (match && match[1]) {
        // Decode URL-encoded slug
        try {
          return decodeURIComponent(match[1]);
        } catch {
          return match[1];
        }
      }
    } catch (error) {
      this.logger.debug(`⚠️ Failed to extract category slug from ${url}: ${error.message}`);
    }

    return null;
  }

  extractWpPostId(url) {
    if (!url) return null;
    const pid = url.searchParams?.get("p");
    if (pid && /^\d+$/.test(pid)) {
      return Number.parseInt(pid, 10);
    }
    return null;
  }

  extractSlugFromPath(pathname) {
    if (!pathname) return null;
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 0) return null;
    return this.normalizeSlug(decodeURIComponent(parts[parts.length - 1]));
  }

  getMappedSlug(wpId, fallbackSlug) {
    if (wpId) {
      const mapping = this.duplicateTracker.getStrapiId("blogPosts", wpId);
      if (mapping?.slug) {
        return mapping.slug;
      }
      if (mapping?.strapiId && mapping?.importedSlug) {
        return mapping.importedSlug;
      }
    }
    if (fallbackSlug) {
      return this.normalizeSlug(fallbackSlug);
    }
    return null;
  }

  normalizeMediaUrl(url) {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    if (url.startsWith("/")) {
      return `${this.strapiMediaBase}${url}`;
    }
    return `${this.strapiMediaBase}/${url}`;
  }

  /**
   * Extract product carousels from HTML content
   * Returns array of carousel objects with original HTML and product slugs
   */
  extractProductCarousels(html) {
    if (!html || typeof html !== "string") {
      return [];
    }

    const carousels = [];

    // Find all carousel containers (id="the-content-products-swiper")
    // Use a more robust approach: find the opening tag, then match until the closing tag
    const carouselStartRegex = /<div[^>]*id=["']the-content-products-swiper["'][^>]*>/gi;

    let startMatch;
    while ((startMatch = carouselStartRegex.exec(html)) !== null) {
      const startIndex = startMatch.index;
      const startTag = startMatch[0];

      // Find the matching closing tag by counting div tags
      let depth = 1;
      let currentIndex = startIndex + startTag.length;
      let endIndex = -1;

      while (currentIndex < html.length && depth > 0) {
        const nextOpen = html.indexOf("<div", currentIndex);
        const nextClose = html.indexOf("</div>", currentIndex);

        if (nextClose === -1) {
          // No closing tag found, break
          break;
        }

        if (nextOpen !== -1 && nextOpen < nextClose) {
          // Found an opening tag before closing tag
          depth++;
          currentIndex = nextOpen + 4;
        } else {
          // Found a closing tag
          depth--;
          if (depth === 0) {
            endIndex = nextClose + 6; // Include '</div>'
            break;
          }
          currentIndex = nextClose + 6;
        }
      }

      if (endIndex === -1) {
        // Couldn't find matching closing tag, skip this carousel
        this.logger.warn(
          `⚠️ Could not find closing tag for carousel starting at index ${startIndex}`,
        );
        continue;
      }

      const carouselHtml = html.substring(startIndex, endIndex);

      // Find all product links within this carousel
      const productLinkRegex = /<a[^>]+href=["']([^"']*\/product\/[^"']+)["'][^>]*>/gi;
      const productSlugs = [];
      let linkMatch;

      while ((linkMatch = productLinkRegex.exec(carouselHtml)) !== null) {
        const productUrl = linkMatch[1];
        const slug = this.extractSlugFromWordPressProductUrl(productUrl);
        if (slug) {
          productSlugs.push(slug);
        }
      }

      if (productSlugs.length > 0) {
        carousels.push({
          originalHtml: carouselHtml,
          productSlugs: [...new Set(productSlugs)], // Remove duplicates
        });
      }
    }

    return carousels;
  }

  /**
   * Generate shortcode from product slugs
   * Quotes non-numeric slugs for Persian support
   */
  generateProductShortcode(slugs) {
    if (!slugs || slugs.length === 0) {
      return "";
    }

    const identifiers = slugs.map((slug) => {
      // Quote non-numeric slugs for Persian support
      const isNumeric = /^\d+$/.test(slug);
      if (isNumeric) {
        return slug;
      }
      // Escape quotes in slug
      return `"${slug.replace(/"/g, '\\"')}"`;
    });

    return `[products:${identifiers.join(",")}]`;
  }

  /**
   * Replace carousel HTML with shortcode
   */
  replaceCarouselWithShortcode(html, carousel, shortcode) {
    if (!html || !carousel || !shortcode) {
      return html;
    }

    // Use simple string replacement instead of regex to avoid escaping issues
    // This is safer for HTML content
    return html.replace(carousel.originalHtml, shortcode);
  }

  /**
   * Get Strapi product slug from WordPress product slug
   * Imports product if it doesn't exist
   */
  async getStrapiSlugFromWordPressSlug(wpSlug, dryRun = false) {
    if (!wpSlug) {
      return null;
    }

    // Check if product already exists in Strapi by checking mappings
    // First, try to find by WordPress slug in product mappings
    const allProductMappings = this.duplicateTracker.getAllMappings("products");
    for (const [wcId, mapping] of Object.entries(allProductMappings)) {
      if (mapping?.slug === wpSlug || mapping?.importedSlug === wpSlug) {
        // Product exists, get its Strapi slug
        try {
          const strapiId = mapping.strapiId || mapping;
          if (strapiId) {
            const strapiProduct = await this.strapiClient.getProductById(strapiId);
            if (strapiProduct?.data?.attributes?.Slug) {
              return strapiProduct.data.attributes.Slug;
            }
          }
        } catch (error) {
          this.logger.debug(
            `⚠️ Failed to get Strapi product ${mapping.strapiId}: ${error.message}`,
          );
        }
        // Fallback: use the WordPress slug if Strapi slug not found
        return wpSlug;
      }
    }

    // Product doesn't exist, need to import it
    try {
      // Get product from WooCommerce by slug
      const wcProduct = await this.wooClient.getProductBySlug(wpSlug);
      if (!wcProduct) {
        this.logger.warn(`⚠️ Product with slug "${wpSlug}" not found in WooCommerce`);
        return null;
      }

      // Import product
      const importResult = await this.productImporter.importSingleProduct(wcProduct, dryRun);

      // Import variations for this product
      if (
        !dryRun &&
        wcProduct.type === "variable" &&
        Array.isArray(wcProduct.variations) &&
        wcProduct.variations.length > 0
      ) {
        try {
          // Get variations from WooCommerce
          let variationPage = 1;
          let hasMoreVariations = true;

          while (hasMoreVariations) {
            const variationResult = await this.wooClient.getProductVariations(
              wcProduct.id,
              variationPage,
              100,
            );

            if (!Array.isArray(variationResult.data) || variationResult.data.length === 0) {
              hasMoreVariations = false;
              break;
            }

            // Get the Strapi product ID from the import result
            const productMapping = this.duplicateTracker.getStrapiId("products", wcProduct.id);
            const parentStrapiId = productMapping?.strapiId || importResult?.strapiId;

            if (parentStrapiId) {
              for (const variation of variationResult.data) {
                variation._parentProduct = wcProduct;
                try {
                  await this.variationImporter.importSingleVariation(
                    variation,
                    parentStrapiId,
                    false,
                  );
                } catch (error) {
                  this.logger.warn(
                    `⚠️ Failed to import variation ${variation.id}: ${error.message}`,
                  );
                }
              }
            }

            if (variationResult.totalPages <= variationPage) {
              hasMoreVariations = false;
            } else {
              variationPage++;
            }
          }
        } catch (error) {
          this.logger.warn(
            `⚠️ Failed to import variations for product ${wcProduct.id}: ${error.message}`,
          );
        }
      }

      // Get the Strapi slug after import
      const mapping = this.duplicateTracker.getStrapiId("products", wcProduct.id);
      if (mapping?.strapiId) {
        try {
          const strapiProduct = await this.strapiClient.getProductById(mapping.strapiId);
          if (strapiProduct?.data?.attributes?.Slug) {
            return strapiProduct.data.attributes.Slug;
          }
        } catch (error) {
          this.logger.debug(
            `⚠️ Failed to get Strapi product ${mapping.strapiId}: ${error.message}`,
          );
        }
      } else if (importResult?.strapiId) {
        // Try using the import result directly
        try {
          const strapiProduct = await this.strapiClient.getProductById(importResult.strapiId);
          if (strapiProduct?.data?.attributes?.Slug) {
            return strapiProduct.data.attributes.Slug;
          }
        } catch (error) {
          this.logger.debug(
            `⚠️ Failed to get Strapi product ${importResult.strapiId}: ${error.message}`,
          );
        }
      }

      // Fallback: return WordPress slug
      return wpSlug;
    } catch (error) {
      this.logger.warn(`⚠️ Failed to import product with slug "${wpSlug}": ${error.message}`);
      return null;
    }
  }

  /**
   * Import products from carousels and get Strapi slugs
   * Limits to 6 products per carousel and only includes successfully imported products
   */
  async importProductsFromCarousels(carousels, dryRun = false) {
    const slugMapping = {}; // { wpSlug: strapiSlug }
    const carouselResults = []; // Array of { carousel, importedSlugs: string[] }

    for (const carousel of carousels) {
      // Limit to first 6 products per carousel
      const limitedSlugs = carousel.productSlugs.slice(0, 6);
      const importedSlugs = [];

      for (const wpSlug of limitedSlugs) {
        if (!slugMapping[wpSlug]) {
          const strapiSlug = await this.getStrapiSlugFromWordPressSlug(wpSlug, dryRun);
          if (strapiSlug) {
            slugMapping[wpSlug] = strapiSlug;
            importedSlugs.push(strapiSlug);
          } else {
            // If import failed, don't include in shortcode
            this.logger.warn(
              `⚠️ Product with slug "${wpSlug}" failed to import, excluding from carousel shortcode`,
            );
          }
        } else {
          // Already imported, use existing mapping
          importedSlugs.push(slugMapping[wpSlug]);
        }
      }

      carouselResults.push({
        carousel,
        importedSlugs,
      });
    }

    return { slugMapping, carouselResults };
  }

  /**
   * Rewrite content carousels - extract, import products, replace with shortcodes
   * Limits to 6 products per carousel and only includes successfully imported products
   */
  async rewriteContentCarousels(html, dryRun = false) {
    if (!html || typeof html !== "string") {
      return html;
    }

    // Extract all carousels
    const carousels = this.extractProductCarousels(html);
    if (carousels.length === 0) {
      return html;
    }

    this.logger.info(`🛒 Found ${carousels.length} product carousel(s) in blog content`);

    // Import all referenced products (limited to 6 per carousel)
    const { slugMapping, carouselResults } = await this.importProductsFromCarousels(
      carousels,
      dryRun,
    );

    // Replace each carousel with shortcode using only successfully imported products
    let rewritten = html;
    for (const { carousel, importedSlugs } of carouselResults) {
      if (importedSlugs.length > 0) {
        const shortcode = this.generateProductShortcode(importedSlugs);
        rewritten = this.replaceCarouselWithShortcode(rewritten, carousel, shortcode);
        this.logger.debug(
          `✅ Replaced carousel with shortcode: [products:${importedSlugs.length} products] (limited from ${carousel.productSlugs.length} found)`,
        );
      } else {
        this.logger.warn(`⚠️ Carousel had no successfully imported products, leaving HTML as-is`);
      }
    }

    return rewritten;
  }

  extractId(entry) {
    if (!entry) return null;
    if (typeof entry === "number") return entry;
    if (entry.id) return entry.id;
    if (entry.data?.id) return entry.data.id;
    if (entry.data?.data?.id) return entry.data.data.id;
    if (entry.strapiId) return entry.strapiId;
    return null;
  }

  logFinalStats() {
    this.logger.success("🎉 Blog post import completed!");
    this.logger.logStats(this.stats);
  }
}

module.exports = BlogPostImporter;
