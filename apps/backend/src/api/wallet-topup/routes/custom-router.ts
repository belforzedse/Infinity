export default {
  routes: [
    {
      method: "POST",
      path: "/wallet/charge-intent",
      handler: "wallet-topup.chargeIntent",
      config: {
        auth: { scope: [] },
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
