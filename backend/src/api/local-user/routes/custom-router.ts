export default {
  routes: [
    {
      method: "POST",
      path: "/sp/local-users",
      handler: "local-user.createUser",
      config: {
        auth: { scope: [] },
      },
    },
    {
      method: "PUT",
      path: "/sp/local-users/:id",
      handler: "local-user.updateUser",
      config: {
        auth: { scope: [] },
      },
    },
  ],
};
