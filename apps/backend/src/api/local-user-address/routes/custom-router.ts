export default {
  routes: [
    {
      method: "GET",
      path: "/local-user-addresses/me",
      handler: "local-user-address.getMyAddresses",
      config: {
        auth: { scope: [] },
      },
    },
    {
      method: "POST",
      path: "/local-user-addresses/create",
      handler: "local-user-address.createAddress",
      config: {
        auth: { scope: [] },
      },
    },
  ],
};
