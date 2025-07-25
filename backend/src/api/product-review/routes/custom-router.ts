export default {
  routes: [
    {
      method: "POST",
      path: "/product-reviews/submit",
      handler: "product-review.submitReview",
      config: {
        auth: false,
        middlewares: ["global::authentication"],
      },
    },
    {
      method: "GET",
      path: "/product-reviews/user/me",
      handler: "product-review.getUserReviews",
      config: {
        auth: false,
        middlewares: ["global::authentication"],
      },
    },
  ],
};
