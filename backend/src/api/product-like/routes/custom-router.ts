export default {
  routes: [
    {
      method: "POST",
      path: "/product-likes/toggle",
      handler: "product-like.toggleFavorite",
      config: {
        auth: false,
        middlewares: ["global::authentication"],
      },
    },
    {
      method: "GET",
      path: "/product-likes/user/me",
      handler: "product-like.getUserLikes",
      config: {
        auth: false,
        middlewares: ["global::authentication"],
      },
    },
  ],
};
