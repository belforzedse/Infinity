export default {
  routes: [
    {
      method: "GET",
      path: "/products/search",
      handler: "product.search",
      config: {
        auth: false,
        policies: [],
        middlewares: [], // No authentication required for product search
      },
    },
    {
      method: "GET",
      path: "/products/by-slug/:slug",
      handler: "product.findBySlug",
      config: {
        auth: false,
        policies: [],
        middlewares: [], // No authentication required for product lookup by slug
      },
    },
  ],
};
