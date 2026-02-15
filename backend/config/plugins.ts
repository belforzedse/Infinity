export default ({ env }) => ({
  documentation: {
    // The documentation plugin writes generated JSON into /src on startup.
    // Disable by default in production to avoid filesystem permission issues.
    enabled: env.bool("STRAPI_ENABLE_DOCUMENTATION", env("NODE_ENV") !== "production"),
  },
  "rest-cache": {
    config: {
      provider: {
        name: "memory",
        getTimeout: 100,
        options: {
          max: 100000, // max cache entries (LRU)
          ttl: 5 * 60, // default TTL in seconds for store (per-response TTL is strategy.maxAge in ms)
        },
      },
      strategy: {
        maxAge: 5 * 60 * 1000, // 5 min TTL per cached response (plugin default is 1h)
        contentTypes: [
          // Semi-dynamic: 5 min TTL, invalidate on content update
          "api::footer.footer",
          "api::navigation.navigation",
          "api::product-category.product-category",
          "api::product-category-content.product-category-content",
          "api::product-size-helper.product-size-helper",
          "api::product-tag.product-tag",
          "api::product-variation-color.product-variation-color",
          "api::product-variation-model.product-variation-model",
          "api::product-variation-size.product-variation-size",
          "api::shipping.shipping",
          "api::shipping-city.shipping-city",
          "api::shipping-province.shipping-province",
          "api::product.product",
          "api::product-variation.product-variation",
          "api::product-faq.product-faq",
          "api::product-review.product-review",
          "api::product-review-like.product-review-like",
          "api::product-review-reply.product-review-reply",
          "api::discount.discount",
          "api::general-discount.general-discount",
        ],
        // Not cached: cart, order, stock, wallet, address, transactions (real-time)
      },
    },
  },
  "users-permissions": {
    config: {
      jwt: {
        expiresIn: "7d", // JWT token expiry (changed from default 30d to 7d)
      },
    },
  },
  upload: {
    config: {
      providerOptions: {
        local: {
          sizeLimit: 0,
        },
      },
    },
  },
});
