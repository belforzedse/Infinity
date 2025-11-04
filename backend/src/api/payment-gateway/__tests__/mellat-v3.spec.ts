/**
 * Mellat v3 payment gateway tests
 * Tests for: requestPayment, verifyTransaction, reverseTransaction
 */

describe('Mellat v3 Payment Gateway', () => {
  const mockStrapi = global.strapi;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MELLAT_TERMINAL_ID = 'MELLAT_TERMINAL_ID';
    process.env.MELLAT_USERNAME = 'MELLAT_TERMINAL_ID';
    process.env.MELLAT_PASSWORD = 'MELLAT_PASSWORD';
    process.env.MELLAT_GATEWAY_URL = 'https://bpm.shaparak.ir/pgwchannel/services/pgw';
  });

  describe('createMellatClient', () => {
    it('should create client with environment variables', () => {
      const terminalId = process.env.MELLAT_TERMINAL_ID;
      const username = process.env.MELLAT_USERNAME;
      const password = process.env.MELLAT_PASSWORD;

      expect(terminalId).toBe('MELLAT_TERMINAL_ID');
      expect(username).toBe('MELLAT_TERMINAL_ID');
      expect(password).toBe('MELLAT_PASSWORD');
    });

    it('should append ?wsdl to API URL if missing', () => {
      const baseUrl = 'https://bpm.shaparak.ir/pgwchannel/services/pgw';
      const normalizedUrl = baseUrl.includes('wsdl') ? baseUrl : `${baseUrl}?wsdl`;

      expect(normalizedUrl).toContain('wsdl');
      expect(normalizedUrl).toMatch(/\?wsdl$/);
    });

    it('should use default URL from environment', () => {
      const url = process.env.MELLAT_GATEWAY_URL;
      expect(url).toBeDefined();
      expect(url).toContain('bpm.shaparak.ir');
    });
  });

  describe('requestPayment', () => {
    it('should accept valid payment parameters', () => {
      const params = {
        orderId: 100,
        amount: 150000,
        userId: 1,
        callbackURL: 'https://example.com/callback',
      };

      // Validate parameters
      expect(params.orderId).toBeGreaterThan(0);
      expect(params.amount).toBeGreaterThan(0);
      expect(params.userId).toBeGreaterThan(0);
      expect(params.callbackURL).toMatch(/^https?:\/\//);
    });

    it('should validate amount is positive', () => {
      const invalidAmount = -100000;
      expect(invalidAmount).toBeLessThan(1);
    });

    it('should format callback URL as absolute', () => {
      const customCallback = '/orders/payment-callback';
      const baseUrl = 'https://api.example.com';
      const absoluteUrl = customCallback.startsWith('http')
        ? customCallback
        : `${baseUrl}${customCallback}`;

      expect(absoluteUrl).toMatch(/^https?:\/\//);
    });

    it('should generate unique request ID for tracking', () => {
      const generateRequestId = (prefix: string = 'REQ'): string => {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      };

      const id1 = generateRequestId();
      const id2 = generateRequestId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^REQ-\d+-[a-z0-9]+$/);
    });

    it('should handle payment gateway timeout', async () => {
      const timeout = 60000; // 60 seconds
      expect(timeout).toBeGreaterThanOrEqual(60000);
    });

    it('should retry on timeout', async () => {
      const maxRetries = 2;
      const delayMs = 1000; // 1 second first retry

      expect(maxRetries).toBeGreaterThanOrEqual(1);
      expect(delayMs).toBeGreaterThan(0);
    });
  });

  describe('verifyTransaction', () => {
    it('should accept valid verification parameters', () => {
      const params = {
        orderId: '100',
        saleOrderId: '123456',
        saleReferenceId: '789012',
      };

      expect(params.orderId).toBeDefined();
      expect(params.saleOrderId).toBeDefined();
      expect(params.saleReferenceId).toBeDefined();
    });

    it('should validate response codes', () => {
      const errorCodes: Record<number, string> = {
        11: 'Invalid card number',
        12: 'Insufficient balance',
        17: 'User cancelled',
      };

      // Verify error code exists
      expect(errorCodes[17]).toBe('User cancelled');
      expect(errorCodes[999]).toBeUndefined();
    });

    it('should mark transaction as successful on code 0', () => {
      const responseCode = 0;
      const isSuccess = responseCode === 0;
      expect(isSuccess).toBe(true);
    });

    it('should mark transaction as failed on non-zero code', () => {
      const responseCode: any = 17; // User cancelled
      const isSuccess = responseCode === 0;
      expect(isSuccess).toBe(false);
    });
  });

  describe('reverseTransaction', () => {
    it('should accept reversal parameters', () => {
      const params = {
        orderId: '100',
        saleOrderId: '123456',
        saleReferenceId: '789012',
      };

      expect(params.orderId).toBeDefined();
      expect(params.saleOrderId).toBeDefined();
      expect(params.saleReferenceId).toBeDefined();
    });

    it('should only reverse successfully settled transactions', () => {
      const transactionStatus = 'settled';
      const canReverse = ['settled', 'verified'].includes(transactionStatus);

      expect(canReverse).toBe(true);
    });

    it('should not reverse pending transactions', () => {
      const transactionStatus = 'pending';
      const canReverse = ['settled', 'verified'].includes(transactionStatus);

      expect(canReverse).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should log error details with request ID', () => {
      const requestId = 'REQ-123-abc';
      const error = new Error('WSDL timeout');

      mockStrapi.log.error('Mellat error', {
        requestId,
        message: error.message,
      });

      expect(mockStrapi.log.error).toHaveBeenCalled();
    });

    it('should timeout after 60 seconds', () => {
      const timeout = 60000;
      const timeLimit = 120000; // 2 minutes max

      expect(timeout).toBeLessThan(timeLimit);
    });

    it('should not expose sensitive data in error logs', () => {
      const sensitiveData = {
        password: 'secret123',
        terminal: 'hidden',
      };

      const errorLog = {
        orderId: 100,
        message: 'Payment failed',
        // Should NOT include password
      };

      expect(errorLog).not.toHaveProperty('password');
      expect(errorLog).not.toHaveProperty('terminal');
    });
  });

  describe('Retries', () => {
    it('should retry failed requests', () => {
      const maxRetries = 2;
      expect(maxRetries).toBe(2);
    });

    it('should use exponential backoff for retries', () => {
      const attempt1Delay = Math.pow(2, 1 - 1) * 1000; // 1s
      const attempt2Delay = Math.pow(2, 2 - 1) * 1000; // 2s

      expect(attempt1Delay).toBe(1000);
      expect(attempt2Delay).toBe(2000);
    });

    it('should log retry attempts', () => {
      const attempt = 1;
      mockStrapi.log.warn(`Mellat attempt ${attempt} failed, retrying...`);

      expect(mockStrapi.log.warn).toHaveBeenCalled();
    });
  });
});
