/**
 * Mellat v3 payment gateway tests - REAL IMPLEMENTATION
 * Tests actual service logic with mocked MellatCheckout library
 */

import { createStrapiMock } from '../../../__tests__/mocks/factories';

// Mock mellat-checkout library
const mockMellatPayment = jest.fn();
const mockMellatVerify = jest.fn();
const mockMellatSettle = jest.fn();
const mockMellatReverse = jest.fn();

jest.mock('mellat-checkout', () => {
  return jest.fn().mockImplementation(() => ({
    paymentRequest: mockMellatPayment,
    verifyPayment: mockMellatVerify,
    settlePayment: mockMellatSettle,
    reversePayment: mockMellatReverse,
  }));
});

// Import service AFTER mocking
let mellatServiceFactory: any;

describe('Mellat v3 Payment Gateway - Real Service', () => {
  let mockStrapi: any;
  let service: any;

  beforeAll(async () => {
    // Dynamic import after mocks are set up
    mellatServiceFactory = (await import('../services/mellat-v3')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    const mock = createStrapiMock();
    mockStrapi = mock.strapi;

    // Create service instance
    service = mellatServiceFactory({ strapi: mockStrapi });
  });

  describe('createMellatClient - REAL client creation', () => {
    it('should create Mellat client with environment configuration', () => {
      // ✅ Call REAL method
      const client = service.createMellatClient();

      expect(client).toBeDefined();
      expect(mockStrapi.log.info).toHaveBeenCalledWith(
        '[Mellat] Creating client with URL:',
        expect.objectContaining({
          apiUrl: expect.stringContaining('wsdl'),
        })
      );
    });

    it('should append ?wsdl to URL if missing - REAL URL formatting', () => {
      process.env.MELLAT_GATEWAY_URL = 'https://test.example.com/pgw';

      const client = service.createMellatClient();

      expect(mockStrapi.log.info).toHaveBeenCalledWith(
        '[Mellat] Creating client with URL:',
        expect.objectContaining({
          apiUrl: 'https://test.example.com/pgw?wsdl',
        })
      );
    });
  });

  describe('formatCallbackUrl - REAL URL formatting', () => {
    it('should return absolute URL when provided', () => {
      const absoluteUrl = 'https://custom.example.com/callback';

      // ✅ Call REAL method
      const result = service.formatCallbackUrl(absoluteUrl);

      expect(result).toBe(absoluteUrl);
    });

    it('should generate production callback from environment', () => {
      process.env.URL = 'https://api.new.infinitycolor.co/';

      const result = service.formatCallbackUrl();

      expect(result).toBe('https://api.new.infinitycolor.co/api/orders/payment-callback');
    });

    it('should handle URLs with trailing slashes', () => {
      process.env.URL = 'https://api.example.com/';

      const result = service.formatCallbackUrl();

      expect(result).toBe('https://api.example.com/api/orders/payment-callback');
    });
  });

  describe('generateRequestId - REAL ID generation', () => {
    it('should generate unique request IDs', () => {
      // ✅ Call REAL method multiple times
      const id1 = service.generateRequestId();
      const id2 = service.generateRequestId();

      expect(id1).toMatch(/^REQ-\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^REQ-\d+-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('should use custom prefix', () => {
      const id = service.generateRequestId('VERIFY');

      expect(id).toMatch(/^VERIFY-\d+-[a-z0-9]+$/);
    });
  });

  describe('logMellatErrorCode - REAL error logging', () => {
    it('should log known error codes with Persian descriptions', () => {
      const requestId = 'TEST-123';

      // ✅ Test known error codes
      service.logMellatErrorCode(requestId, 11); // Invalid card
      expect(mockStrapi.log.error).toHaveBeenCalledWith(
        expect.stringContaining('[TEST-123] Mellat Error Code 11:'),
      );
      expect(mockStrapi.log.error).toHaveBeenCalledWith(
        expect.stringContaining('شماره کارت نامعتبر است'),
      );

      service.logMellatErrorCode(requestId, 17); // User cancelled
      expect(mockStrapi.log.error).toHaveBeenCalledWith(
        expect.stringContaining('کاربر از انجام تراکنش منصرف شده است'),
      );
    });

    it('should handle unknown error codes', () => {
      service.logMellatErrorCode('REQ-999', 9999);

      expect(mockStrapi.log.error).toHaveBeenCalledWith(
        expect.stringContaining('Unknown error code: 9999'),
      );
    });
  });

  describe('requestPayment - REAL payment request with retry logic', () => {
    it('should request payment successfully on first try', async () => {
      // Mock successful payment request
      mockMellatPayment.mockResolvedValue({
        RefId: '1234567890',
      });

      const params = {
        orderId: 100,
        amount: 150000, // Toman
        userId: 1,
        callbackURL: 'https://example.com/callback',
        contractId: 50,
      };

      // ✅ Call REAL method
      const result = await service.requestPayment(params);

      expect(result.success).toBe(true);
      expect(result.refId).toBe('1234567890');
      expect(result.redirectUrl).toContain('bpm.shaparak.ir');
      expect(mockMellatPayment).toHaveBeenCalledTimes(1);
      expect(mockMellatPayment).toHaveBeenCalledWith({
        amount: 1500000, // ✅ Verify Toman → Rial conversion (× 10)
        orderId: 100,
        callBackUrl: 'https://example.com/callback',
      });
    });

    it('should retry on failure and succeed - REAL retry logic', async () => {
      // Mock: fail first, succeed second
      mockMellatPayment
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({ RefId: '9876543210' });

      const params = {
        orderId: 200,
        amount: 250000,
        userId: 2,
        callbackURL: 'https://example.com/callback',
      };

      // ✅ Call REAL method with retry logic
      const result = await service.requestPayment(params);

      expect(result.success).toBe(true);
      expect(result.refId).toBe('9876543210');
      // ✅ Verify retry happened (called twice)
      expect(mockMellatPayment).toHaveBeenCalledTimes(2);
      expect(mockStrapi.log.warn).toHaveBeenCalledWith(
        expect.stringContaining('Mellat payment request attempt 1 failed'),
        expect.any(Object)
      );
    });

    it('should fail after max retries - REAL error handling', async () => {
      // Mock: fail all attempts
      mockMellatPayment
        .mockRejectedValueOnce(new Error('Timeout 1'))
        .mockRejectedValueOnce(new Error('Timeout 2'))
        .mockRejectedValueOnce(new Error('Timeout 3'));

      const params = {
        orderId: 300,
        amount: 100000,
        userId: 3,
        callbackURL: 'https://example.com/callback',
      };

      const result = await service.requestPayment(params);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Timeout');
      // ✅ Verify retried 2 times (total 3 attempts: 1 + 2 retries)
      expect(mockMellatPayment).toHaveBeenCalledTimes(3);
      expect(mockStrapi.log.error).toHaveBeenCalled();
    });

    it('should handle Mellat error response codes', async () => {
      // Mock Mellat returning error code 17 (user cancelled)
      mockMellatPayment.mockResolvedValue({
        ResCode: 17,
      });

      const params = {
        orderId: 400,
        amount: 200000,
        userId: 4,
        callbackURL: 'https://example.com/callback',
      };

      const result = await service.requestPayment(params);

      expect(result.success).toBe(false);
      expect(result.resCode).toBe(17);
      expect(mockStrapi.log.error).toHaveBeenCalledWith(
        expect.stringContaining('Mellat Error Code 17:'),
      );
    });

    it('should convert amount from Toman to Rial correctly', async () => {
      mockMellatPayment.mockResolvedValue({ RefId: 'test-ref' });

      const params = {
        orderId: 500,
        amount: 350000, // 350k Toman
        userId: 5,
        callbackURL: 'https://example.com/callback',
      };

      await service.requestPayment(params);

      // ✅ Verify REAL conversion: 350,000 Toman → 3,500,000 Rial
      expect(mockMellatPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 3500000,
        })
      );
    });
  });

  describe('verifyTransaction - REAL verification', () => {
    it('should verify transaction successfully', async () => {
      mockMellatVerify.mockResolvedValue({
        ResCode: 0, // Success
      });

      const params = {
        orderId: '100',
        saleOrderId: '100',
        saleReferenceId: '123456789',
      };

      // ✅ Call REAL method
      const result = await service.verifyTransaction(params);

      expect(result.success).toBe(true);
      expect(mockMellatVerify).toHaveBeenCalledWith({
        orderId: 100,
        saleOrderId: 100,
        saleReferenceId: 123456789,
      });
    });

    it('should handle verification failure - REAL error handling', async () => {
      mockMellatVerify.mockResolvedValue({
        ResCode: 42, // Sale transaction not found
      });

      const params = {
        orderId: '200',
        saleOrderId: '200',
        saleReferenceId: '987654321',
      };

      const result = await service.verifyTransaction(params);

      expect(result.success).toBe(false);
      expect(result.resCode).toBe(42);
      expect(mockStrapi.log.error).toHaveBeenCalledWith(
        expect.stringContaining('Mellat Error Code 42:'),
      );
    });

    it('should handle verify exceptions', async () => {
      mockMellatVerify.mockRejectedValue(new Error('SOAP connection failed'));

      const params = {
        orderId: '300',
        saleOrderId: '300',
        saleReferenceId: '111111111',
      };

      const result = await service.verifyTransaction(params);

      expect(result.success).toBe(false);
      expect(result.error).toContain('SOAP connection failed');
    });
  });

  describe('settleTransaction - REAL settlement', () => {
    it('should settle verified transaction', async () => {
      mockMellatSettle.mockResolvedValue({
        ResCode: 0,
      });

      const params = {
        orderId: '100',
        saleOrderId: '100',
        saleReferenceId: '555555555',
      };

      // ✅ Call REAL method
      const result = await service.settleTransaction(params);

      expect(result.success).toBe(true);
      expect(mockMellatSettle).toHaveBeenCalledWith({
        orderId: 100,
        saleOrderId: 100,
        saleReferenceId: 555555555,
      });
    });

    it('should handle settlement errors', async () => {
      mockMellatSettle.mockResolvedValue({
        ResCode: 45, // Already settled
      });

      const params = {
        orderId: '200',
        saleOrderId: '200',
        saleReferenceId: '666666666',
      };

      const result = await service.settleTransaction(params);

      expect(result.success).toBe(false);
      expect(result.resCode).toBe(45);
    });
  });

  describe('reverseTransaction - REAL reversal', () => {
    it('should reverse transaction successfully', async () => {
      mockMellatReverse.mockResolvedValue({
        ResCode: 0,
      });

      const params = {
        orderId: '100',
        saleOrderId: '100',
        saleReferenceId: '777777777',
      };

      // ✅ Call REAL method
      const result = await service.reverseTransaction(params);

      expect(result.success).toBe(true);
      expect(mockMellatReverse).toHaveBeenCalledWith({
        orderId: 100,
        saleOrderId: 100,
        saleReferenceId: 777777777,
      });
    });

    it('should handle reversal errors', async () => {
      mockMellatReverse.mockResolvedValue({
        ResCode: 45, // Already settled (cannot reverse)
      });

      const params = {
        orderId: '200',
        saleOrderId: '200',
        saleReferenceId: '888888888',
      };

      const result = await service.reverseTransaction(params);

      expect(result.success).toBe(false);
      expect(result.resCode).toBe(45);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle full successful payment flow', async () => {
      // Request → Verify → Settle
      mockMellatPayment.mockResolvedValue({ RefId: 'ABC123' });
      mockMellatVerify.mockResolvedValue({ ResCode: 0 });
      mockMellatSettle.mockResolvedValue({ ResCode: 0 });

      // ✅ Request payment
      const paymentResult = await service.requestPayment({
        orderId: 999,
        amount: 500000,
        userId: 10,
        callbackURL: 'https://example.com/callback',
      });

      expect(paymentResult.success).toBe(true);
      expect(paymentResult.refId).toBe('ABC123');

      // ✅ Verify payment
      const verifyResult = await service.verifyTransaction({
        orderId: '999',
        saleOrderId: '999',
        saleReferenceId: 'ABC123',
      });

      expect(verifyResult.success).toBe(true);

      // ✅ Settle payment
      const settleResult = await service.settleTransaction({
        orderId: '999',
        saleOrderId: '999',
        saleReferenceId: 'ABC123',
      });

      expect(settleResult.success).toBe(true);
    });

    it('should handle payment failure and reversal flow', async () => {
      mockMellatPayment.mockResolvedValue({ RefId: 'DEF456' });
      mockMellatVerify.mockResolvedValue({ ResCode: 12 }); // Insufficient balance
      mockMellatReverse.mockResolvedValue({ ResCode: 0 });

      const paymentResult = await service.requestPayment({
        orderId: 888,
        amount: 1000000,
        userId: 20,
        callbackURL: 'https://example.com/callback',
      });

      expect(paymentResult.success).toBe(true);

      // ✅ Verification fails
      const verifyResult = await service.verifyTransaction({
        orderId: '888',
        saleOrderId: '888',
        saleReferenceId: 'DEF456',
      });

      expect(verifyResult.success).toBe(false);
      expect(verifyResult.resCode).toBe(12);

      // ✅ Reverse the transaction
      const reverseResult = await service.reverseTransaction({
        orderId: '888',
        saleOrderId: '888',
        saleReferenceId: 'DEF456',
      });

      expect(reverseResult.success).toBe(true);
    });
  });
});
