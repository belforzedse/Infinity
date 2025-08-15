/**
 * Custom router for report APIs
 */

export default {
  routes: [
    {
      method: "GET",
      path: "/reports/liquidity",
      handler: "report.liquidity",
      config: {
        auth: false,
        middlewares: ["global::authentication"],
      },
    },
    {
      method: "GET",
      path: "/reports/product-sales",
      handler: "report.productSales",
      config: {
        auth: false,
        middlewares: ["global::authentication"],
      },
    },
    {
      method: "GET",
      path: "/reports/gateway-liquidity",
      handler: "report.gatewayLiquidity",
      config: {
        auth: false,
        middlewares: ["global::authentication"],
      },
    },
  ],
};
