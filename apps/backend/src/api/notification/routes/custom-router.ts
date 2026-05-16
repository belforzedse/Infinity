export default {
  routes: [
    {
      method: "GET",
      path: "/notifications/user/me",
      handler: "notification.listMine",
      config: {
        auth: { scope: [] },
        middlewares: [],
        policies: [],
      },
    },
    {
      method: "GET",
      path: "/notifications/user/me/unread-count",
      handler: "notification.unreadCount",
      config: {
        auth: { scope: [] },
        middlewares: [],
        policies: [],
      },
    },
    {
      method: "POST",
      path: "/notifications/user/me/read-all",
      handler: "notification.markAllRead",
      config: {
        auth: { scope: [] },
        middlewares: [],
        policies: [],
      },
    },
    {
      method: "POST",
      path: "/notifications/:id/read",
      handler: "notification.markRead",
      config: {
        auth: { scope: [] },
        middlewares: [],
        policies: [],
      },
    },
  ],
};
