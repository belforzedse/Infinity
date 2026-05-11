export default {
  routes: [
    {
      method: "POST",
      path: "/post-comment-likes/toggle",
      handler: "post-comment-like.toggle",
      config: {
        auth: { scope: [] },
      },
    },
  ],
};
