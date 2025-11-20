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
          // Static/reference data - safe to cache
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

          // Semi-dynamic - products, reviews (5 min cache acceptable)
          "api::product.product",
          "api::product-variation.product-variation",
          "api::product-faq.product-faq",
          "api::product-review.product-review",
          "api::product-review-like.product-review-like",
          "api::product-review-reply.product-review-reply",

          // Discounts (5 min acceptable, changes infrequently)
          "api::discount.discount",
          "api::general-discount.general-discount",
        ],
        // Exclude real-time content types - they need fresh data
        // Cart, Order, Stock, Wallet, Address, Transactions are NOT cached
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
