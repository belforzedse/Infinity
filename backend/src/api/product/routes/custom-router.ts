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
  ],
};
