#!/usr/bin/env node
/* eslint-disable no-console */

const STRAPI_BASE_URL = (process.env.STRAPI_BASE_URL || "http://localhost:1337/api").replace(/\/$/, "");
const PRODUCT_BOOST_KEYWORDS = [
  "G",
  "G0020",
  "W0069",
  "W0043",
  "W0039",
  "W0096",
  "W002",
  "W0042",
  "W0018",
  "W0036",
  "W009",
  "W0010",
  "W0035",
  "G0015",
  "G0018",
  "W0030",
  "G004",
  "G005",
  "G006",
  "G003",
  "G007",
  "W0022",
  "W0029",
  "G0017",
  "W0025",
  "W0014",
  "W0033",
  "G0023",
  "G0024",
  "G0013",
  "W0012",
  "W0027",
  "W008",
  "W0024",
  "W0031",
  "W004",
  "W0015",
  "G002",
  "W0076",
  "W0087",
  "W0089",
  "G009",
  "G0011",
  "G0019",
  "G0030",
  "G0021",
  "G008",
  "G0022",
  "G0035",
  "G0031",
  "G0036",
  "W007",
  "G001",
  "W0058",
  "G0014",
  "G0029",
  "G0039",
  "G0038",
  "W005",
  "W0032",
  "W0038",
  "W0080",
  "G0028",
  "G00101",
  "G0098",
  "G0096",
];

const SECTION_ORDER = [
  "newest",
  "favorites",
  "discounted",
  "gifPromoSlot1",
  "gifPromoSlot2",
  "custom",
  "weeklyPicks",
  "everyoneFollows",
];

function normalizeIds(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const ids = [];
  for (const item of value) {
    const id = Number(item);
    if (!Number.isFinite(id) || id <= 0 || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

function normalizeAssignment(value) {
  const input = value && typeof value === "object" ? value : {};
  return {
    mode: input.mode === "category" ? "category" : "manual",
    productIds: normalizeIds(input.productIds),
    categorySlug: typeof input.categorySlug === "string" ? input.categorySlug.trim() : "",
  };
}

function normalizeSettings(raw) {
  const settings = raw?.data?.attributes || raw?.data || {};
  return {
    homeNewestProductIds: normalizeIds(settings.homeNewestProductIds),
    homeDiscountedProductIds: normalizeIds(settings.homeDiscountedProductIds),
    homeGifPromoEnabled: settings.homeGifPromoEnabled === true,
    homeGifPromoSlot1Image: String(settings.homeGifPromoSlot1Image || ""),
    homeGifPromoSlot2Image: String(settings.homeGifPromoSlot2Image || ""),
    homeGifPromoSlot1Assignment: normalizeAssignment(settings.homeGifPromoSlot1Assignment),
    homeGifPromoSlot2Assignment: normalizeAssignment(settings.homeGifPromoSlot2Assignment),
    homeCustomSectionEnabled: settings.homeCustomSectionEnabled === true,
    homeCustomSectionAssignment: normalizeAssignment(settings.homeCustomSectionAssignment),
    homeWeeklyPicksEnabled: settings.homeWeeklyPicksEnabled === true,
    homeWeeklyPicksProductIds: normalizeIds(settings.homeWeeklyPicksProductIds),
    homeEveryoneFollowsEnabled: settings.homeEveryoneFollowsEnabled === true,
    homeEveryoneFollowsProductIds: normalizeIds(settings.homeEveryoneFollowsProductIds),
  };
}

function titleFilterParams() {
  if (PRODUCT_BOOST_KEYWORDS.length === 0) return "";
  if (PRODUCT_BOOST_KEYWORDS.length === 1) {
    return `filters[Title][$containsi]=${encodeURIComponent(PRODUCT_BOOST_KEYWORDS[0])}`;
  }
  return PRODUCT_BOOST_KEYWORDS.map(
    (keyword, index) => `filters[$or][${index}][Title][$containsi]=${encodeURIComponent(keyword)}`,
  ).join("&");
}

function baseCardParams(limit) {
  return [
    "view=card",
    "filters[Status][$eq]=Active",
    "filters[removedAt][$null]=true",
    "filters[product_variations][Price][$gte]=1",
    "filters[product_variations][product_stock][Count][$gt]=0",
    `pagination[limit]=${limit}`,
    "pagination[withCount]=false",
  ];
}

async function getJson(path) {
  const response = await fetch(`${STRAPI_BASE_URL}${path}`);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${path} failed with HTTP ${response.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

function attrsOf(product) {
  return product?.attributes || product || {};
}

function productHasStock(product) {
  const attrs = attrsOf(product);
  return attrs.IsAvailable === true || Number(attrs.InventoryCount || 0) > 0;
}

function productHasDiscount(product) {
  const attrs = attrsOf(product);
  const price = Number(attrs.Price || 0);
  const discountPrice = Number(attrs.DiscountPrice || 0);
  const discount = Number(attrs.Discount || 0);
  return discount > 0 || (price > 0 && discountPrice > 0 && discountPrice < price);
}

function productTitleMatchesKeywords(product) {
  const title = String(attrsOf(product).Title || "").toLowerCase();
  return PRODUCT_BOOST_KEYWORDS.some((keyword) => title.includes(keyword.toLowerCase()));
}

function cardComparable(product) {
  const attrs = attrsOf(product);
  const cover = attrs.CoverImage?.data?.attributes || attrs.CoverImage || null;
  const category =
    attrs.product_main_category?.data?.attributes || attrs.product_main_category || null;
  return {
    id: Number(product.id),
    title: attrs.Title || null,
    slug: attrs.Slug || null,
    price: Number(attrs.Price || 0),
    discountPrice: attrs.DiscountPrice == null ? null : Number(attrs.DiscountPrice),
    discount: attrs.Discount == null ? null : Number(attrs.Discount),
    isAvailable: attrs.IsAvailable === true,
    inventoryCount: Number(attrs.InventoryCount || 0),
    colorsCount: Number(attrs.ColorsCount || 0),
    colorCodes: Array.isArray(attrs.ColorCodes) ? attrs.ColorCodes : [],
    seenCount: Number(attrs.SeenCount || 0),
    averageRating: attrs.AverageRating == null ? null : Number(attrs.AverageRating),
    ratingCount: attrs.RatingCount == null ? null : Number(attrs.RatingCount),
    coverImage: cover
      ? {
          url: cover.url || null,
          alternativeText: cover.alternativeText || null,
          width: cover.width || null,
          height: cover.height || null,
          formats: cover.formats || null,
          mime: cover.mime || null,
        }
      : null,
    category: category ? { title: category.Title || null, slug: category.Slug || null } : null,
  };
}

async function fetchProductsByIds(ids, limit = Math.max(ids.length, 20)) {
  if (!ids.length) return [];
  const idParams = ids.map((id, index) => `filters[id][$in][${index}]=${id}`).join("&");
  const response = await getJson(`/products?${[...baseCardParams(limit), idParams].join("&")}`);
  const idOrder = new Map(ids.map((id, index) => [Number(id), index]));
  return (response.data || [])
    .filter(productHasStock)
    .sort((a, b) => (idOrder.get(Number(a.id)) ?? 9999) - (idOrder.get(Number(b.id)) ?? 9999));
}

async function fetchAssignmentProducts(assignment, limit) {
  if (assignment.mode === "manual") {
    return fetchProductsByIds(assignment.productIds, Math.max(assignment.productIds.length, 20)).then(
      (products) => products.slice(0, limit),
    );
  }

  if (!assignment.categorySlug) return [];
  const params = [
    ...baseCardParams(limit),
    `filters[product_main_category][Slug][$eq]=${encodeURIComponent(assignment.categorySlug)}`,
    "sort[0]=createdAt:desc",
  ];
  const response = await getJson(`/products?${params.join("&")}`);
  return (response.data || []).slice(0, limit);
}

async function buildOldSections(settings) {
  const batchResponse = await getJson(`/products?${baseCardParams(36).join("&")}`);
  const batchProducts = (batchResponse.data || []).filter(productHasStock);

  const newest =
    settings.homeNewestProductIds.length > 0
      ? await fetchProductsByIds(settings.homeNewestProductIds)
      : await getJson(
          `/products?${[
            ...baseCardParams(20),
            titleFilterParams(),
            "sort[0]=createdAt:desc",
          ]
            .filter(Boolean)
            .join("&")}`,
        ).then((response) => (response.data || []).filter(productHasStock).slice(0, 20));

  const discounted =
    settings.homeDiscountedProductIds.length > 0
      ? await fetchProductsByIds(settings.homeDiscountedProductIds)
      : batchProducts
          .filter(productHasDiscount)
          .sort((a, b) => {
            const aMatch = productTitleMatchesKeywords(a);
            const bMatch = productTitleMatchesKeywords(b);
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            return 0;
          })
          .slice(0, 20);

  const favorites = [...batchProducts]
    .sort((a, b) => Number(attrsOf(b).AverageRating || 0) - Number(attrsOf(a).AverageRating || 0))
    .slice(0, 20);

  return {
    newest,
    favorites,
    discounted,
    gifPromoSlot1:
      settings.homeGifPromoEnabled && settings.homeGifPromoSlot1Image.trim()
        ? await fetchAssignmentProducts(settings.homeGifPromoSlot1Assignment, 4)
        : [],
    gifPromoSlot2:
      settings.homeGifPromoEnabled && settings.homeGifPromoSlot2Image.trim()
        ? await fetchAssignmentProducts(settings.homeGifPromoSlot2Assignment, 4)
        : [],
    custom: settings.homeCustomSectionEnabled
      ? await fetchAssignmentProducts(settings.homeCustomSectionAssignment, 20)
      : [],
    weeklyPicks: settings.homeWeeklyPicksEnabled
      ? await fetchProductsByIds(settings.homeWeeklyPicksProductIds)
      : [],
    everyoneFollows: settings.homeEveryoneFollowsEnabled
      ? await fetchProductsByIds(settings.homeEveryoneFollowsProductIds)
      : [],
  };
}

async function buildNewSections() {
  const response = await getJson("/products/homepage-sections");
  const sections = {};
  for (const section of response?.data?.sections || []) {
    sections[section.id] = section.products || [];
  }
  return sections;
}

function diffSections(oldSections, newSections) {
  const diffs = [];
  for (const sectionId of SECTION_ORDER) {
    const oldProducts = (oldSections[sectionId] || []).map(cardComparable);
    const newProducts = (newSections[sectionId] || []).map(cardComparable);
    const oldIds = oldProducts.map((product) => product.id);
    const newIds = newProducts.map((product) => product.id);

    if (JSON.stringify(oldIds) !== JSON.stringify(newIds)) {
      diffs.push({
        sectionId,
        field: "product-order",
        oldValue: oldIds,
        newValue: newIds,
      });
      continue;
    }

    for (let index = 0; index < oldProducts.length; index += 1) {
      const oldProduct = oldProducts[index];
      const newProduct = newProducts[index];
      if (JSON.stringify(oldProduct) !== JSON.stringify(newProduct)) {
        diffs.push({
          sectionId,
          field: `product[${index}]#${oldProduct.id}`,
          oldValue: oldProduct,
          newValue: newProduct,
        });
      }
    }
  }
  return diffs;
}

async function main() {
  console.log(`[homepage-compare] Comparing old vs new homepage sections at ${STRAPI_BASE_URL}`);
  const settings = normalizeSettings(await getJson("/settings"));
  const [oldSections, newSections] = await Promise.all([
    buildOldSections(settings),
    buildNewSections(),
  ]);
  const diffs = diffSections(oldSections, newSections);

  if (diffs.length > 0) {
    console.error(`[homepage-compare] Found ${diffs.length} mismatch(es).`);
    for (const diff of diffs) {
      console.error(`\n[${diff.sectionId}] ${diff.field}`);
      console.error("old:", JSON.stringify(diff.oldValue, null, 2));
      console.error("new:", JSON.stringify(diff.newValue, null, 2));
    }
    process.exit(1);
  }

  for (const sectionId of SECTION_ORDER) {
    console.log(`[homepage-compare] ${sectionId}: ${(oldSections[sectionId] || []).length} products`);
  }
  console.log("[homepage-compare] PASS");
}

main().catch((error) => {
  console.error("[homepage-compare] ERROR", error);
  process.exit(1);
});
