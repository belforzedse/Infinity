export default {
  routes: [
    {
      method: "GET",
      path: "/blog-comments/post/:postId",
      handler: "blog-comment.findByPost",
      config: {
        auth: false,
        middlewares: [],
        policies: [],
      },
    },
    {
      method: "PUT",
      path: "/blog-comments/:id/approve",
      handler: "blog-comment.approve",
      config: {
        auth: { scope: [] },
        middlewares: [],
        policies: [],
      },
    },
    {
      method: "PUT",
      path: "/blog-comments/:id/reject",
      handler: "blog-comment.reject",
      config: {
        auth: { scope: [] },
        middlewares: [],
        policies: [],
      },
    },
  ],
};

