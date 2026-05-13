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
    {
      method: "GET",
      path: "/post-comment-likes/user/me",
      handler: "post-comment-like.getUserLikes",
      config: {
        auth: { scope: [] },
      },
    },
  ],
};
