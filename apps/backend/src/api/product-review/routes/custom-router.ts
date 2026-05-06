export default {
  routes: [
    {
      method: "POST",
      path: "/product-reviews/submit",
      handler: "product-review.submitReview",
      config: {
        auth: { scope: [] },
      },
    },
    {
      method: "GET",
      path: "/product-reviews/user/me",
      handler: "product-review.getUserReviews",
      config: {
        auth: { scope: [] },
      },
    },
  ],
};
