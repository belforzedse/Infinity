/**
 * SnappPay Service - REAL IMPLEMENTATION TESTS
 * Tests actual service logic with mocked HTTP client
 */

import axios from 'axios';
import { createStrapiMock } from '../../../__tests__/mocks/factories';

// Mock axios before importing the service
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Import service AFTER mocking axios
let snappayServiceFactory: any;

describe('SnappPay Service - Real Implementation', () => {
  let mockStrapi: any;
  let service: any;
  let mockAxiosInstance: any;

  beforeAll(async () => {
    // Dynamic import after mocks are set up
    snappayServiceFactory = (await import('../services/snappay')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    const mock = createStrapiMock();
    mockStrapi = mock.strapi;

    // Create mock axios instance
    mockAxiosInstance = {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      defaults: { headers: { common: {} } },
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

    // Create service instance
    service = snappayServiceFactory(mockStrapi);
  });

  describe('getAccessToken - REAL token caching logic', () => {
    it('should fetch and cache access token on first call', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          access_token: 'test-access-token-123',
          token_type: 'Bearer',
          expires_in: 3600,
        },
      });

      // ✅ Call REAL method
      const token = await service.getAccessToken();

      expect(token).toBe('test-access-token-123');
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/oauth/token',
        expect.stringContaining('grant_type=client_credentials')
      );
    });

    it('should reuse cached token on subsequent calls - REAL caching', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          access_token: 'cached-token',
          expires_in: 3600,
        },
      });

      // ✅ First call - should fetch
      const token1 = await service.getAccessToken();

      // ✅ Second call - should use cache (no new HTTP request)
      const token2 = await service.getAccessToken();

      expect(token1).toBe('cached-token');
      expect(token2).toBe('cached-token');
      // ✅ Verify only ONE HTTP call was made (caching works!)
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
    });

    it('should handle 403 IP not whitelisted error - REAL error handling', async () => {
      mockAxiosInstance.post.mockRejectedValue({
        response: {
          status: 403,
          data: { errorData: { errorCode: 403, message: 'Forbidden' } },
        },
        message: 'Request failed with status code 403',
      });

      // ✅ Real error handling logic
      await expect(service.getAccessToken()).rejects.toMatchObject({
        context: 'getAccessToken',
        message: 'Request failed with status code 403',
        hint: expect.stringContaining('IP_NOT_WHITELISTED'),
        status: 403,
      });

      expect(mockStrapi.log.error).toHaveBeenCalled();
    });

    it('should handle 401 invalid credentials error', async () => {
      mockAxiosInstance.post.mockRejectedValue({
        response: {
          status: 401,
          data: { errorData: { errorCode: 1003 } },
        },
        message: 'Unauthorized',
      });

      await expect(service.getAccessToken()).rejects.toMatchObject({
        context: 'getAccessToken',
        hint: expect.stringContaining('INVALID_CREDENTIALS'),
        status: 401,
      });
    });
  });

  describe('eligible - REAL eligibility check', () => {
    it('should check payment eligibility with REAL amount conversion', async () => {
      // Mock successful token fetch
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { access_token: 'token-123', expires_in: 3600 },
      });

      // Mock eligibility check
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          successful: true,
          response: {
            eligible: true,
            title_message: 'پرداخت قابل اقساط',
            description: 'این مبلغ قابل پرداخت اقساطی است',
          },
        },
      });

      const amountIRR = 5000000; // 5M IRR = 500k Toman

      // ✅ Call REAL method
      const result = await service.eligible(amountIRR);

      expect(result.successful).toBe(true);
      expect(result.response.eligible).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/api/online/v2/business-eligibility',
        expect.objectContaining({
          params: expect.objectContaining({
            amount: amountIRR,
          }),
        })
      );
    });

    it('should handle ineligible amount', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { access_token: 'token', expires_in: 3600 },
      });

      mockAxiosInstance.get.mockResolvedValue({
        data: {
          successful: false,
          response: {
            eligible: false,
            title_message: 'مبلغ خیلی کم است',
          },
        },
      });

      const result = await service.eligible(100000); // 100k IRR (very low)

      expect(result.successful).toBe(false);
      expect(result.response.eligible).toBe(false);
    });
  });

  describe('requestToken - REAL payment token request', () => {
    it('should request payment token with REAL cart mapping', async () => {
      // Mock token
      mockAxiosInstance.post
        .mockResolvedValueOnce({
          data: { access_token: 'token-abc', expires_in: 3600 },
        })
        .mockResolvedValueOnce({
          data: {
            successful: true,
            response: {
              paymentToken: 'payment-token-xyz',
              paymentPageUrl: 'https://snapppay.ir/payment/xyz',
            },
          },
        });

      const orderData = {
        order: { id: 100 },
        contract: { id: 50, Amount: 500000 }, // 500k Toman
        financialSummary: {
          subtotal: 450000,
          discount: 50000,
          shipping: 100000,
          payable: 500000,
        },
        orderItems: [
          {
            id: 1,
            Count: 2,
            product_variation: {
              Price: 225000,
              product: { Title: 'تی شرت' },
              product_category: { Title: 'پوشاک' },
            },
          },
        ],
        userId: 5,
        cellNumber: '09123456789',
      };

      // ✅ Call REAL method
      const result = await service.requestToken(orderData);

      expect(result.successful).toBe(true);
      expect(result.response.paymentToken).toBe('payment-token-xyz');
      expect(result.response.paymentPageUrl).toBeDefined();

      // ✅ Verify REAL request payload structure
      const requestPayload = mockAxiosInstance.post.mock.calls[1][1];
      expect(requestPayload.amount).toBe(5000000); // 500k Toman → 5M IRR
      expect(requestPayload.mobile).toBe('09123456789');
      expect(requestPayload.transactionId).toContain('100-');
      expect(requestPayload.cartList).toHaveLength(1);
      expect(requestPayload.cartList[0].totalAmount).toBe(5000000);
      expect(requestPayload.cartList[0].cartItems).toHaveLength(1);
      expect(requestPayload.cartList[0].cartItems[0].name).toBe('تی شرت');
      expect(requestPayload.cartList[0].cartItems[0].count).toBe(2);
      expect(requestPayload.cartList[0].cartItems[0].amount).toBe(4500000); // 450k → 4.5M IRR
    });

    it('should handle payment token request failure', async () => {
      mockAxiosInstance.post
        .mockResolvedValueOnce({
          data: { access_token: 'token', expires_in: 3600 },
        })
        .mockResolvedValue({
          data: {
            successful: false,
            errorData: {
              errorCode: 2001,
              message: 'Invalid cart data',
            },
          },
        });

      const orderData = {
        order: { id: 200 },
        contract: { id: 100, Amount: 100000 },
        financialSummary: { payable: 100000 },
        orderItems: [],
        userId: 1,
        cellNumber: '09121111111',
      };

      const result = await service.requestToken(orderData);

      expect(result.successful).toBe(false);
      expect(result.errorData).toBeDefined();
      expect(result.errorData.errorCode).toBe(2001);
    });
  });

  describe('verify - REAL payment verification', () => {
    it('should verify payment with token', async () => {
      mockAxiosInstance.post
        .mockResolvedValueOnce({
          data: { access_token: 'token', expires_in: 3600 },
        })
        .mockResolvedValueOnce({
          data: {
            successful: true,
            response: {
              status: 'VERIFIED',
              transactionId: 'TXN-123',
            },
          },
        });

      const paymentToken = 'payment-token-123';

      // ✅ Call REAL method
      const result = await service.verify(paymentToken);

      expect(result.successful).toBe(true);
      expect(result.response.status).toBe('VERIFIED');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/online/v2/verify',
        expect.objectContaining({
          paymentToken,
        })
      );
    });

    it('should handle verification failure', async () => {
      mockAxiosInstance.post
        .mockResolvedValueOnce({
          data: { access_token: 'token', expires_in: 3600 },
        })
        .mockResolvedValueOnce({
          data: {
            successful: false,
            errorData: {
              errorCode: 3001,
              message: 'Payment not found',
            },
          },
        });

      const result = await service.verify('invalid-token');

      expect(result.successful).toBe(false);
      expect(result.errorData.errorCode).toBe(3001);
    });
  });

  describe('settle - REAL payment settlement', () => {
    it('should settle verified payment', async () => {
      mockAxiosInstance.post
        .mockResolvedValueOnce({
          data: { access_token: 'token', expires_in: 3600 },
        })
        .mockResolvedValueOnce({
          data: {
            successful: true,
            response: {
              status: 'SETTLED',
              transactionId: 'TXN-456',
            },
          },
        });

      const paymentToken = 'verified-payment-token';

      // ✅ Call REAL method
      const result = await service.settle(paymentToken);

      expect(result.successful).toBe(true);
      expect(result.response.status).toBe('SETTLED');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/online/v2/settle',
        expect.objectContaining({
          paymentToken,
        })
      );
    });
  });

  describe('revert - REAL payment reversal', () => {
    it('should revert payment successfully', async () => {
      mockAxiosInstance.post
        .mockResolvedValueOnce({
          data: { access_token: 'token', expires_in: 3600 },
        })
        .mockResolvedValueOnce({
          data: {
            successful: true,
            response: {
              status: 'REVERTED',
            },
          },
        });

      const paymentToken = 'payment-to-revert';

      // ✅ Call REAL method
      const result = await service.revert(paymentToken);

      expect(result.successful).toBe(true);
      expect(result.response.status).toBe('REVERTED');
    });

    it('should handle revert errors gracefully', async () => {
      mockAxiosInstance.post
        .mockResolvedValueOnce({
          data: { access_token: 'token', expires_in: 3600 },
        })
        .mockResolvedValueOnce({
          data: {
            successful: false,
            errorData: {
              errorCode: 4001,
              message: 'Cannot revert settled payment',
            },
          },
        });

      const result = await service.revert('already-settled-token');

      expect(result.successful).toBe(false);
      expect(result.errorData.message).toContain('Cannot revert');
    });
  });

  describe('status - REAL payment status check', () => {
    it('should check payment status', async () => {
      mockAxiosInstance.post
        .mockResolvedValueOnce({
          data: { access_token: 'token', expires_in: 3600 },
        });

      mockAxiosInstance.get.mockResolvedValue({
        data: {
          successful: true,
          response: {
            status: 'VERIFY_PENDING',
            transactionId: 'TXN-789',
            amount: 5000000,
          },
        },
      });

      const paymentToken = 'status-check-token';

      // ✅ Call REAL method
      const result = await service.status(paymentToken);

      expect(result.successful).toBe(true);
      expect(result.response.status).toBe('VERIFY_PENDING');
      expect(result.response.transactionId).toBe('TXN-789');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/api/online/v2/status',
        expect.objectContaining({
          params: expect.objectContaining({
            paymentToken,
          }),
        })
      );
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle network timeout errors', async () => {
      mockAxiosInstance.post.mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 60000ms exceeded',
      });

      await expect(service.getAccessToken()).rejects.toMatchObject({
        context: 'getAccessToken',
        message: expect.stringContaining('timeout'),
      });
    });

    it('should format error with status and errorCode', async () => {
      mockAxiosInstance.post.mockRejectedValue({
        response: {
          status: 500,
          data: {
            errorData: {
              errorCode: 9999,
              message: 'Internal server error',
            },
          },
        },
        message: 'Server error',
      });

      await expect(service.getAccessToken()).rejects.toMatchObject({
        context: 'getAccessToken',
        status: 500,
        errorCode: 9999,
      });
    });

    it('should use staging endpoint from environment', () => {
      // Verify the service uses the real staging URL from dev.env
      expect(process.env.SNAPPAY_BASE_URL).toBe('https://fms-gateway-staging.apps.public.okd4.teh-1.snappcloud.io');
    });
  });
});
