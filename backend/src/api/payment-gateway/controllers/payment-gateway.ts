/**
 * payment-gateway controller
 */

import { factories } from '@strapi/strapi'
import { Strapi } from "@strapi/strapi";

export default factories.createCoreController('api::payment-gateway.payment-gateway', 
  ({ strapi }: { strapi: Strapi }) => ({
    
    // Test endpoint for debugging Mellat gateway
    async testMellat(ctx) {
      try {
        const { amount = 10000, orderId = Math.floor(Math.random() * 1000000) } = ctx.request.body;
        
        strapi.log.info('Testing Mellat gateway with parameters:', { amount, orderId });
        
        // Get the Mellat service
        const paymentService = strapi.service("api::payment-gateway.mellat");
        
        // Test payment request
        const result = await paymentService.requestPayment({
          orderId: orderId,
          amount: amount,
          userId: 1, // Test user ID
          callbackURL: "/test/callback",
          contractId: 0
        });
        
        strapi.log.info('Mellat test result:', result);
        
        return ctx.send({
          data: {
            success: result.success,
            message: result.success ? "Mellat gateway test successful" : "Mellat gateway test failed",
            result: result,
            testParameters: { amount, orderId },
            timestamp: new Date().toISOString()
          }
        });
        
      } catch (error) {
        strapi.log.error('Error testing Mellat gateway:', {
          message: error.message,
          stack: error.stack
        });
        
        return ctx.badRequest('Test failed', {
          data: {
            success: false,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
          }
        });
      }
    },

    // Test endpoint for the new Mellat V2 implementation  
    async testMellatV2(ctx) {
      try {
        const { amount = 10000, orderId = Math.floor(Math.random() * 1000000) } = ctx.request.body;
        
        strapi.log.info('Testing Mellat V2 gateway with parameters:', { amount, orderId });
        
        // Get the Mellat V2 service
        const paymentService = strapi.service("api::payment-gateway.mellat-v2");
        
        // Test payment request
        const result = await paymentService.requestPayment({
          orderId: orderId,
          amount: amount,
          userId: 1, // Test user ID
          callbackURL: "/test/callback",
          contractId: 0
        });
        
        strapi.log.info('Mellat V2 test result:', result);
        
        return ctx.send({
          data: {
            success: result.success,
            message: result.success ? "Mellat V2 gateway test successful" : "Mellat V2 gateway test failed",
            result: result,
            testParameters: { amount, orderId },
            timestamp: new Date().toISOString(),
            version: "v2"
          }
        });
        
      } catch (error) {
        strapi.log.error('Error testing Mellat V2 gateway:', {
          message: error.message,
          stack: error.stack
        });
        
        return ctx.badRequest('Test failed', {
          data: {
            success: false,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            version: "v2"
          }
        });
      }
    },

    // Test endpoint for the new Mellat V3 implementation using mellat-checkout package
    async testMellatV3(ctx) {
      try {
        const { amount = 10000, orderId = Math.floor(Math.random() * 1000000) } = ctx.request.body;
        
        strapi.log.info('Testing Mellat V3 gateway with parameters:', { amount, orderId });
        
        // Get the Mellat V3 service
        const paymentService = strapi.service("api::payment-gateway.mellat-v3");
        
        // Test payment request
        const result = await paymentService.requestPayment({
          orderId: orderId,
          amount: amount,
          userId: 1, // Test user ID
          callbackURL: "/test/callback",
          contractId: 0
        });
        
        strapi.log.info('Mellat V3 test result:', result);
        
        return ctx.send({
          data: {
            success: result.success,
            message: result.success ? "Mellat V3 gateway test successful" : "Mellat V3 gateway test failed",
            result: result,
            testParameters: { amount, orderId },
            timestamp: new Date().toISOString(),
            version: "v3",
            package: "mellat-checkout"
          }
        });
        
      } catch (error) {
        strapi.log.error('Error testing Mellat V3 gateway:', {
          message: error.message,
          stack: error.stack
        });
        
        return ctx.badRequest('Test failed', {
          data: {
            success: false,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            version: "v3",
            package: "mellat-checkout"
          }
        });
      }
    }
  })
);
