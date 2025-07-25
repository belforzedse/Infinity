/**
 * Custom router for payment gateway APIs
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/payment-gateway/test-mellat',
      handler: 'payment-gateway.testMellat',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/payment-gateway/test-mellat-v2',
      handler: 'payment-gateway.testMellatV2',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/payment-gateway/test-mellat-v3',
      handler: 'payment-gateway.testMellatV3',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    }
  ],
};
