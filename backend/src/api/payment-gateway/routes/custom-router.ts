/**
 * Custom router for payment gateway APIs
 */

export default {
  routes: [
    {
      method: "POST",
      path: "/payment-gateway/test-mellat",
      handler: "payment-gateway.testMellat",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/payment-gateway/test-mellat-v2",
      handler: "payment-gateway.testMellatV2",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/payment-gateway/test-mellat-v3",
      handler: "payment-gateway.testMellatV3",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/payment-gateway/test-snappay",
      handler: "payment-gateway.testSnappPay",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/payment-gateway/snapp-eligible",
      handler: "payment-gateway.snappEligible",
      config: {
        auth: false,
        middlewares: ["global::authentication"],
      },
    },
    {
      method: "POST",
      path: "/payment-gateway/test-snappay-cancel",
      handler: "payment-gateway.testSnappayCancel",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/payment-gateway/test-snappay-revert",
      handler: "payment-gateway.testSnappayRevert",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/payment-gateway/test-snappay-status",
      handler: "payment-gateway.testSnappayStatus",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/payment-gateway/test-snappay-update",
      handler: "payment-gateway.testSnappayUpdate",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
