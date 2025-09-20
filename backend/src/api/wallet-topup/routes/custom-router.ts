export default {
  routes: [
    {
      method: "POST",
      path: "/wallet/charge-intent",
      handler: "wallet-topup.chargeIntent",
      config: {
        auth: false,
        middlewares: ["global::authentication"],
      },
    },
    {
      method: "POST",
      path: "/wallet/payment-callback",
      handler: "wallet-topup.paymentCallback",
      config: {
        auth: false,
      },
    },
  ],
};
