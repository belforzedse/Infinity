export default {
  routes: [
    {
      method: "POST",
      path: "/post-likes/toggle",
      handler: "post-like.toggle",
      config: {
        auth: { scope: [] },
      },
    },
    {
      method: "GET",
      path: "/post-likes/user/me",
      handler: "post-like.getUserLikes",
      config: {
        auth: { scope: [] },
      },
    },
  ],
};
