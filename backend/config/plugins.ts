export default () => ({
  "rest-cache": {
    config: {
      provider: {
        name: "memory",
        getTimeout: 100,
        options: {
          max: 100000,
          maxAge: 5 * 60 * 1000, // 5 minutes (300000ms) - reasonable for e-commerce
        },
      },
      strategy: {
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
