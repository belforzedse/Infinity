export default {
  routes: [
    {
      method: "GET",
      path: "/local-user-wallet/me",
      handler: "local-user-wallet.getCurrentUserWallet",
      config: {
        auth: false,
      },
    },
  ],
};
