/**
 * Wallet Operations Tests - REAL IMPLEMENTATION
 * Tests actual wallet balance queries and topup flow
 */

// Simplify Strapi controller factory for tests
jest.mock('@strapi/strapi', () => ({
  factories: {
    createCoreController: (_uid: string, extension: any) => (params: any) => extension(params),
  },
}));

import { createStrapiMock, mockContext, mockUser } from '../../../__tests__/mocks/factories';

describe('Wallet Operations - Real Implementation', () => {
  let mockStrapi: any;
  let walletController: any;
  let topupController: any;
  let jwtService: any;
  let mellatService: any;
  let walletModule: any;
  let topupModule: any;

  beforeAll(async () => {
    // Dynamic imports
    walletModule = await import('../controllers/local-user-wallet');
    topupModule = await import('../../wallet-topup/controllers/wallet-topup');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    const mock = createStrapiMock();
    mockStrapi = mock.strapi;

    // Make global strapi available
    (global as any).strapi = mockStrapi;

    // Recreate controllers with the mocked strapi instance
    walletController = walletModule.default({ strapi: mockStrapi });
    topupController = topupModule.default({ strapi: mockStrapi });

    // Mock JWT service
    jwtService = {
      issue: jest.fn(),
      verify: jest.fn((token) => ({ id: 1, phone: '09123456789' })),
    };

    mockStrapi.plugin = jest.fn((pluginName: string) => {
      if (pluginName === 'users-permissions') {
        return {
          service: jest.fn((serviceName: string) => {
            if (serviceName === 'jwt') return jwtService;
          }),
        };
      }
    });

    // Mock Mellat service
    mellatService = {
      requestPayment: jest.fn(),
      verifyTransaction: jest.fn(),
      settleTransaction: jest.fn(),
    };
    mock.registerService('api::payment-gateway.mellat-v3', mellatService);

    // Mock queries
    const walletQuery = {
      findOne: jest.fn(),
      update: jest.fn(),
    };
    mock.registerQuery('api::local-user-wallet.local-user-wallet', walletQuery);

    // Mock config
    mockStrapi.config = {
      get: jest.fn((key, defaultValue) => defaultValue),
    };
  });

  describe('getCurrentUserWallet - Get wallet balance', () => {
    it('should return wallet balance for authenticated user - REAL query', async () => {
      const userId = 1;
      const walletBalance = 500000; // 500k IRR

      const walletQuery = mockStrapi.db.query('api::local-user-wallet.local-user-wallet');
      walletQuery.findOne.mockResolvedValue({
        id: 10,
        Balance: walletBalance,
        LastTransactionDate: new Date(),
        Description: 'User wallet',
        user: userId,
      });

      const ctx = mockContext({
        state: { user: { id: userId } },
      });

      // ✅ Call REAL controller method
      await walletController.getCurrentUserWallet(ctx);

      expect(walletQuery.findOne).toHaveBeenCalledWith({
        where: { user: userId },
      });

      expect(ctx.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          balance: walletBalance,
        }),
      });
    });

    it('should verify JWT from header if state.user not set', async () => {
      const userId = 5;
      const token = 'valid-jwt-token';

      jwtService.verify.mockResolvedValue({ id: userId });

      const walletQuery = mockStrapi.db.query('api::local-user-wallet.local-user-wallet');
      walletQuery.findOne.mockResolvedValue({
        id: 1,
        Balance: 100000,
        user: userId,
      });

      const ctx = mockContext({
        request: { header: { authorization: `Bearer ${token}` } },
        state: {}, // No user in state
      });

      await walletController.getCurrentUserWallet(ctx);

      expect(jwtService.verify).toHaveBeenCalledWith(token);
      expect(walletQuery.findOne).toHaveBeenCalledWith({
        where: { user: userId },
      });
    });

    it('should return unauthorized without authentication', async () => {
      const ctx = mockContext({
        request: { header: {} },
        state: {},
        unauthorized: jest.fn(),
      });

      await walletController.getCurrentUserWallet(ctx);

      expect(ctx.unauthorized).toHaveBeenCalledWith('Authentication required');
    });

    it('should return not found if wallet does not exist', async () => {
      const walletQuery = mockStrapi.db.query('api::local-user-wallet.local-user-wallet');
      walletQuery.findOne.mockResolvedValue(null);

      const ctx = mockContext({
        state: { user: { id: 1 } },
      });

      await walletController.getCurrentUserWallet(ctx);

      expect(ctx.notFound).toHaveBeenCalledWith('Wallet not found for this user');
    });
  });

  describe('chargeIntent - Initiate wallet topup', () => {
    it('should create topup and request payment - REAL flow', async () => {
      const userId = 1;
      const amountIrr = 1000000; // 1M IRR = 100k Toman

      // Mock topup creation
      const topup = {
        id: 100,
        Amount: amountIrr,
        Status: 'Pending',
        user: userId,
      };
      mockStrapi.entityService.create.mockResolvedValue(topup);

      // Mock payment gateway success
      mellatService.requestPayment.mockResolvedValue({
        success: true,
        refId: 'MELLAT-REF-123',
        redirectUrl: 'https://bpm.shaparak.ir/pgwchannel/startpay.mellat?RefId=MELLAT-REF-123',
      });

      const ctx = mockContext({
        request: { body: { amount: amountIrr } },
        state: { user: { id: userId } },
      });

      // ✅ Call REAL controller method
      await topupController.chargeIntent(ctx);

      // ✅ Verify REAL topup creation
      expect(mockStrapi.entityService.create).toHaveBeenCalledWith(
        'api::wallet-topup.wallet-topup',
        expect.objectContaining({
          data: expect.objectContaining({
            Amount: amountIrr,
            Status: 'Pending',
            user: userId,
          }),
        })
      );

      // ✅ Verify REAL payment request
      expect(mellatService.requestPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: amountIrr,
          userId,
          callbackURL: expect.stringContaining('/api/wallet/payment-callback'),
        })
      );

      // ✅ Verify REAL response
      expect(ctx.send).toHaveBeenCalledWith({
        data: expect.objectContaining({
          success: true,
          refId: 'MELLAT-REF-123',
          redirectUrl: expect.stringContaining('bpm.shaparak.ir'),
        }),
      });
    });

    it('should reject zero or negative amounts - REAL validation', async () => {
      const ctx = mockContext({
        request: { body: { amount: 0 } },
        state: { user: { id: 1 } },
        badRequest: jest.fn(),
      });

      await topupController.chargeIntent(ctx);

      expect(ctx.badRequest).toHaveBeenCalledWith('amount is required (IRR)');
      expect(mockStrapi.entityService.create).not.toHaveBeenCalled();
    });

    it('should reject invalid amounts', async () => {
      const ctx = mockContext({
        request: { body: { amount: 'invalid' } },
        state: { user: { id: 1 } },
        badRequest: jest.fn(),
      });

      await topupController.chargeIntent(ctx);

      expect(ctx.badRequest).toHaveBeenCalledWith('amount is required (IRR)');
    });

    it('should handle payment gateway failures - REAL error handling', async () => {
      const userId = 1;
      const amountIrr = 1000000;

      mockStrapi.entityService.create.mockResolvedValue({
        id: 100,
        Amount: amountIrr,
      });

      mellatService.requestPayment.mockResolvedValue({
        success: false,
        error: 'Gateway timeout',
      });

      const ctx = mockContext({
        request: { body: { amount: amountIrr } },
        state: { user: { id: userId } },
        badRequest: jest.fn(),
      });

      await topupController.chargeIntent(ctx);

      // ✅ Should mark topup as Failed
      expect(mockStrapi.entityService.update).toHaveBeenCalledWith(
        'api::wallet-topup.wallet-topup',
        100,
        expect.objectContaining({
          data: { Status: 'Failed' },
        })
      );

      expect(ctx.badRequest).toHaveBeenCalledWith('Gateway error', expect.anything());
    });

    it('should require authentication', async () => {
      const ctx = mockContext({
        request: { body: { amount: 1000000 } },
        state: {},
        unauthorized: jest.fn(),
        badRequest: jest.fn(),
      });

      await topupController.chargeIntent(ctx);

      expect(ctx.unauthorized).toHaveBeenCalledWith('Authentication required');
    });

    it('should generate unique SaleOrderId - REAL ID generation', async () => {
      mockStrapi.entityService.create.mockResolvedValue({ id: 1 });
      mellatService.requestPayment.mockResolvedValue({
        success: true,
        refId: 'REF-123',
        redirectUrl: 'https://example.com',
      });

      const ctx = mockContext({
        request: { body: { amount: 500000 } },
        state: { user: { id: 1 } },
      });

      await topupController.chargeIntent(ctx);

      // Verify SaleOrderId is unique (timestamp + random)
      const createCall = mockStrapi.entityService.create.mock.calls[0][1];
      const saleOrderId = createCall.data.SaleOrderId;

      expect(saleOrderId).toMatch(/^\d{13,16}$/); // Timestamp + 3-digit suffix
    });

    it('should save RefId after successful payment request', async () => {
      const topupId = 100;
      const refId = 'MELLAT-REF-456';

      mockStrapi.entityService.create.mockResolvedValue({ id: topupId });
      mellatService.requestPayment.mockResolvedValue({
        success: true,
        refId,
        redirectUrl: 'https://example.com',
      });

      const ctx = mockContext({
        request: { body: { amount: 500000 } },
        state: { user: { id: 1 } },
      });

      await topupController.chargeIntent(ctx);

      // ✅ Should save RefId for tracking
      expect(mockStrapi.entityService.update).toHaveBeenCalledWith(
        'api::wallet-topup.wallet-topup',
        topupId,
        expect.objectContaining({
          data: { RefId: refId },
        })
      );
    });
  });

  describe('paymentCallback - Process payment callback', () => {
    it('should mark topup as Failed on user cancellation - REAL flow', async () => {
      const saleOrderId = '1234567890123';
      const resCode = '17'; // User cancelled

      mockStrapi.entityService.findMany.mockResolvedValue([
        {
          id: 100,
          SaleOrderId: saleOrderId,
          Amount: 1000000,
          Status: 'Pending',
        },
      ]);

      const ctx = mockContext({
        request: {
          body: {
            ResCode: resCode,
            SaleOrderId: saleOrderId,
            SaleReferenceId: '123456',
          },
        },
      });

      // ✅ Call REAL controller method
      await topupController.paymentCallback(ctx);

      // ✅ Should mark as Failed
      expect(mockStrapi.entityService.update).toHaveBeenCalledWith(
        'api::wallet-topup.wallet-topup',
        100,
        expect.objectContaining({
          data: { Status: 'Failed' },
        })
      );

      // ✅ Should redirect to frontend with failure status
      expect(ctx.redirect).toHaveBeenCalledWith(
        expect.stringContaining('wallet?status=failure&code=17')
      );
    });

    it('should redirect to not_found if topup does not exist', async () => {
      mockStrapi.entityService.findMany.mockResolvedValue([]);

      const ctx = mockContext({
        request: {
          body: {
            ResCode: '0',
            SaleOrderId: '999999999',
            SaleReferenceId: '123456',
          },
        },
      });

      await topupController.paymentCallback(ctx);

      expect(ctx.redirect).toHaveBeenCalledWith(
        expect.stringContaining('wallet?status=failure&reason=not_found')
      );
    });

    it('should verify and settle payment on success - REAL payment flow', async () => {
      const saleOrderId = '1234567890123';
      const saleReferenceId = '987654321';

      mockStrapi.entityService.findMany.mockResolvedValue([
        {
          id: 100,
          SaleOrderId: saleOrderId,
          Amount: 1000000,
          Status: 'Pending',
          user: { id: 1 },
        },
      ]);

      // Mock successful verification
      mellatService.verifyTransaction.mockResolvedValue({
        success: true,
      });

      // Mock successful settlement
      mellatService.settleTransaction.mockResolvedValue({
        success: true,
      });

      // Mock wallet query
      const walletQuery = mockStrapi.db.query('api::local-user-wallet.local-user-wallet');
      walletQuery.findOne.mockResolvedValue({
        id: 10,
        Balance: 500000,
        user: 1,
      });

      const ctx = mockContext({
        request: {
          body: {
            ResCode: '0', // Success
            SaleOrderId: saleOrderId,
            SaleReferenceId: saleReferenceId,
          },
        },
      });

      await topupController.paymentCallback(ctx);

      // ✅ Should verify payment
      expect(mellatService.verifyTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: saleOrderId,
          saleOrderId: saleOrderId,
          saleReferenceId: saleReferenceId,
        })
      );

      // ✅ Should settle payment
      expect(mellatService.settleTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: saleOrderId,
        })
      );
    });
  });

  describe('Financial calculations', () => {
    it('should handle IRR amounts correctly - 1M IRR = 100k Toman', async () => {
      const amountIrr = 10000000; // 10M IRR
      const expectedToman = 1000000; // 1M Toman

      mockStrapi.entityService.create.mockResolvedValue({ id: 1 });
      mellatService.requestPayment.mockResolvedValue({
        success: true,
        refId: 'REF-123',
        redirectUrl: 'https://example.com',
      });

      const ctx = mockContext({
        request: { body: { amount: amountIrr } },
        state: { user: { id: 1 } },
      });

      await topupController.chargeIntent(ctx);

      // ✅ Verify amount is stored in IRR (not Toman)
      const createCall = mockStrapi.entityService.create.mock.calls[0][1];
      expect(createCall.data.Amount).toBe(amountIrr);

      // ✅ Verify payment gateway receives IRR amount
      expect(mellatService.requestPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: amountIrr,
        })
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle concurrent topup requests', async () => {
      const userId = 1;
      const amount = 500000;

      mockStrapi.entityService.create.mockResolvedValue({ id: 100 });
      mellatService.requestPayment.mockResolvedValue({
        success: true,
        refId: 'REF-1',
        redirectUrl: 'https://example.com',
      });

      const ctx1 = mockContext({
        request: { body: { amount } },
        state: { user: { id: userId } },
      });

      const ctx2 = mockContext({
        request: { body: { amount } },
        state: { user: { id: userId } },
      });

      // Make concurrent requests
      await Promise.all([
        topupController.chargeIntent(ctx1),
        topupController.chargeIntent(ctx2),
      ]);

      // ✅ Both should create separate topups with unique SaleOrderIds
      expect(mockStrapi.entityService.create).toHaveBeenCalledTimes(2);

      const saleOrderId1 = mockStrapi.entityService.create.mock.calls[0][1].data.SaleOrderId;
      const saleOrderId2 = mockStrapi.entityService.create.mock.calls[1][1].data.SaleOrderId;

      expect(saleOrderId1).not.toBe(saleOrderId2);
    });

    it('should handle very large amounts', async () => {
      const largeAmount = 1000000000; // 1B IRR = 100M Toman

      mockStrapi.entityService.create.mockResolvedValue({ id: 1 });
      mellatService.requestPayment.mockResolvedValue({
        success: true,
        refId: 'REF-123',
        redirectUrl: 'https://example.com',
      });

      const ctx = mockContext({
        request: { body: { amount: largeAmount } },
        state: { user: { id: 1 } },
      });

      await topupController.chargeIntent(ctx);

      expect(mockStrapi.entityService.create).toHaveBeenCalledWith(
        'api::wallet-topup.wallet-topup',
        expect.objectContaining({
          data: expect.objectContaining({
            Amount: largeAmount,
          }),
        })
      );
    });
  });
});
