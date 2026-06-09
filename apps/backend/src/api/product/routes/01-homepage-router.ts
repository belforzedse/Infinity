export default {
  routes: [
    {
      method: "GET",
      path: "/products/homepage-sections",
      handler: "product.homepageSections",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
