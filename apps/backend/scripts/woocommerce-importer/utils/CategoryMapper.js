const fs = require("fs");
const path = require("path");

/**
 * Category Mapper - Maps WooCommerce categories to Strapi categories
 *
 * Features:
 * - Load WooCommerce and Strapi categories
 * - Store mapping relationships
 * - Display category hierarchies
 * - Create/update/delete mappings
 * - Auto-suggestion based on name similarity
 */
class CategoryMapper {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.mappingFile = path.join(
      this.config.duplicateTracking.storageDir,
      "category-mappings-custom.json"
    );
    this.mappings = this.loadMappings();
  }

  /**
   * Load existing category mappings from file
   */
  loadMappings() {
    try {
      if (fs.existsSync(this.mappingFile)) {
        const data = JSON.parse(fs.readFileSync(this.mappingFile, "utf8"));
        this.logger.debug(`📂 Loaded ${Object.keys(data).length} category mappings`);
        return data;
      }
    } catch (error) {
      this.logger.warn(`⚠️ Failed to load category mappings: ${error.message}`);
    }

    return {};
  }

  /**
   * Save category mappings to file
   */
  saveMappings() {
    try {
      fs.writeFileSync(this.mappingFile, JSON.stringify(this.mappings, null, 2));
      this.logger.debug("✅ Saved category mappings");
    } catch (error) {
      this.logger.error(`❌ Failed to save category mappings: ${error.message}`);
    }
  }

  /**
   * Get mapped Strapi category ID for WooCommerce category
   */
  getMappedCategoryId(wooCommerceId) {
    return this.mappings[wooCommerceId]?.strapiId || null;
  }

  /**
   * Set mapping from WooCommerce category to Strapi category
   */
  setMapping(wooCommerceId, strapiId, wcName = "", strapiName = "") {
    this.mappings[wooCommerceId] = {
      strapiId,
      wcId: wooCommerceId,
      wcName: wcName,
      strapiName: strapiName,
      mappedAt: new Date().toISOString()
    };
    this.saveMappings();
    this.logger.info(`✅ Mapped WC Category ${wooCommerceId} (${wcName}) → Strapi ${strapiId} (${strapiName})`);
  }

  /**
   * Delete mapping
   */
  deleteMapping(wooCommerceId) {
    if (this.mappings[wooCommerceId]) {
      const wcName = this.mappings[wooCommerceId].wcName;
      delete this.mappings[wooCommerceId];
      this.saveMappings();
      this.logger.info(`🗑️ Deleted mapping for WC Category ${wooCommerceId} (${wcName})`);
    }
  }

  /**
   * Get all mappings
   */
  getAllMappings() {
    return { ...this.mappings };
  }

  /**
   * Clear all mappings
   */
  clearAllMappings() {
    this.mappings = {};
    this.saveMappings();
    this.logger.info("🧹 Cleared all category mappings");
  }

  /**
   * Format categories for display with hierarchy
   */
  formatCategoryHierarchy(categories) {
    const byParent = new Map();

    // Group by parent
    for (const cat of categories) {
      const parentId = cat.parent || 0;
      if (!byParent.has(parentId)) {
        byParent.set(parentId, []);
      }
      byParent.get(parentId).push(cat);
    }

    // Format hierarchically
    const formatted = [];

    function formatCategory(cat, depth = 0) {
      const prefix = "  ".repeat(depth);
      const indent = depth > 0 ? "├─ " : "• ";
      const childCount = (byParent.get(cat.id) || []).length;
      const childStr = childCount > 0 ? ` (${childCount} children)` : "";
      return `${prefix}${indent}${cat.name} (ID: ${cat.id})${childStr}`;
    }

    const roots = byParent.get(0) || [];
    roots.sort((a, b) => a.name.localeCompare(b.name, "fa"));

    for (const root of roots) {
      formatted.push(formatCategory(root, 0));

      function addChildren(parentId, depth) {
        const children = byParent.get(parentId) || [];
        children.sort((a, b) => a.name.localeCompare(b.name, "fa"));
        for (const child of children) {
          formatted.push(formatCategory(child, depth + 1));
          addChildren(child.id, depth + 1);
        }
      }

      addChildren(root.id, 1);
    }

    return formatted;
  }

  /**
   * Calculate name similarity score (0-1)
   */
  calculateSimilarity(str1, str2) {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    // Exact match
    if (s1 === s2) return 1;

    // Contains match
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;

    // Partial match
    let matchCount = 0;
    const shorter = s1.length < s2.length ? s1 : s2;
    for (let i = 0; i < shorter.length; i++) {
      if ((s1[i] === s2[i]) ||
          (s1.charCodeAt(i) >= 1600 && s1.charCodeAt(i) <= 1700 &&
           s2.charCodeAt(i) >= 1600 && s2.charCodeAt(i) <= 1700)) {
        matchCount++;
      }
    }
    return matchCount / Math.max(s1.length, s2.length);
  }

  /**
   * Find best matching Strapi category for WooCommerce category
   */
  findBestMatch(wcCategory, strapiCategories) {
    let bestMatch = null;
    let bestScore = 0;

    for (const strapiCat of strapiCategories) {
      // Strapi categories have 'Title' in attributes, not DisplayName or Name
      const strapiName = strapiCat.attributes?.Title || strapiCat.Title || "";
      const score = this.calculateSimilarity(wcCategory.name, strapiName);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = strapiCat;
      }
    }

    return bestScore > 0.5 ? { category: bestMatch, score: bestScore } : null;
  }

  /**
   * Get mapping suggestions for unmapped WooCommerce categories
   */
  getSuggestions(wcCategories, strapiCategories) {
    const suggestions = [];

    for (const wcCat of wcCategories) {
      if (this.getMappedCategoryId(wcCat.id)) {
        continue; // Already mapped
      }

      const match = this.findBestMatch(wcCat, strapiCategories);
      if (match) {
        suggestions.push({
          woocommerce: wcCat,
          suggested: match.category,
          confidence: Math.round(match.score * 100),
          alreadyMapped: false
        });
      }
    }

    return suggestions;
  }

  /**
   * Display mapping status
   */
  displayMappingStatus(wcCategories, strapiCategories) {
    const allMappings = this.getAllMappings();
    const mapped = Object.keys(allMappings).length;
    const total = wcCategories.length;

    console.log("\n📊 Category Mapping Status:");
    console.log(`  ├─ Mapped: ${mapped} / ${total} categories`);
    console.log(`  ├─ Unmapped: ${total - mapped}`);
    console.log(`  └─ Strapi categories available: ${strapiCategories.length}`);

    if (mapped > 0) {
      console.log("\n✅ Current Mappings:");
      for (const [wcId, mapping] of Object.entries(allMappings)) {
        console.log(`  • WC ${wcId} (${mapping.wcName}) → Strapi ${mapping.strapiId} (${mapping.strapiName})`);
      }
    }

    // Show unmapped
    const unmappedWC = wcCategories.filter(cat => !allMappings[cat.id]);
    if (unmappedWC.length > 0) {
      console.log(`\n⚠️ Unmapped WooCommerce Categories (${unmappedWC.length}):`);
      for (const cat of unmappedWC.slice(0, 10)) {
        console.log(`  • ${cat.name} (ID: ${cat.id})`);
      }
      if (unmappedWC.length > 10) {
        console.log(`  ... and ${unmappedWC.length - 10} more`);
      }
    }
  }

  /**
   * Get mapping statistics
   */
  getStats() {
    return {
      totalMappings: Object.keys(this.mappings).length,
      mappings: this.mappings
    };
  }
}

module.exports = CategoryMapper;
