export default {
  routes: [
    {
      method: "POST",
      path: "/post-bookmarks/toggle",
      handler: "post-bookmark.toggle",
      config: {
        auth: { scope: [] },
      },
    },
    {
      method: "GET",
      path: "/post-bookmarks/user/me",
      handler: "post-bookmark.getUserBookmarks",
      config: {
        auth: { scope: [] },
      },
    },
  ],
};
