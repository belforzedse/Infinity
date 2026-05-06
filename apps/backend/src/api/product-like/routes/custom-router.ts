export default {
  routes: [
    {
      method: "POST",
      path: "/product-likes/toggle",
      handler: "product-like.toggleFavorite",
      config: {
        auth: { scope: [] },
      },
    },
    {
      method: "GET",
      path: "/product-likes/user/me",
      handler: "product-like.getUserLikes",
      config: {
        auth: { scope: [] },
      },
    },
  ],
};
