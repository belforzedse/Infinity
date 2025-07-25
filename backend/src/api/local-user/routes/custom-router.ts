export default {
  routes: [
    {
      method: "POST",
      path: "/sp/local-users",
      handler: "local-user.createUser",
      config: {
        auth: false,
        policies: [],
        middlewares: ["global::authentication"],
      },
    },
    {
      method: "PUT",
      path: "/sp/local-users/:id",
      handler: "local-user.updateUser",
      config: {
        auth: false,
        policies: [],
        middlewares: ["global::authentication"],
      },
    },
  ],
};
