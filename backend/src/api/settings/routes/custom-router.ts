export default {
  routes: [
    {
      method: "GET",
      path: "/site-settings",
      handler: "settings.find",
      config: {
        auth: false,
        middlewares: [],
        policies: [],
      },
    },
    {
      method: "PUT",
      path: "/site-settings",
      handler: "settings.update",
      config: {
        auth: { scope: [] },
        middlewares: [],
        policies: [],
      },
    },
  ],
};
