/**
 * SnappPay Service - REAL IMPLEMENTATION TESTS
 * Exercises the service surface the code actually exports today.
 */

import axios from 'axios';
import { createStrapiMock } from '../../../__tests__/mocks/factories';

// Mock axios before importing the service
jest.mock('axios');
let mockedAxios: jest.Mocked<typeof axios>;

describe('SnappPay Service - Real Implementation', () => {
  let mockStrapi: any;
  let service: any;
  let mockAxiosInstance: any;
  let snappayServiceFactory: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios = axios as jest.Mocked<typeof axios>;
    const mock = createStrapiMock();
    mockStrapi = mock.strapi;

    mockAxiosInstance = {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      defaults: { headers: { common: {} } },
    };
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      snappayServiceFactory = require('../services/snappay').default;
      service = snappayServiceFactory({ strapi: mockStrapi });
    });
  });

  describe('eligible - token fetch + eligibility check', () => {
    it('fetches token once and calls eligibility endpoint', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { access_token: 'token-123', expires_in: 3600 },
      });
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          successful: true,
          response: { eligible: true },
        },
      });

      const amountIRR = 5_000_000;
      const result = await service.eligible(amountIRR);

      expect(result.successful).toBe(true);
      expect(result.response?.eligible).toBe(true);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/online/v1/oauth/token',
        expect.anything(),
        expect.anything(),
      );
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/api/online/offer/v1/eligible',
        expect.objectContaining({
          params: expect.objectContaining({ amount: amountIRR }),
          headers: expect.objectContaining({ Authorization: 'Bearer token-123' }),
        }),
      );
    });

    it('reuses cached token on subsequent calls', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { access_token: 'token-abc', expires_in: 3600 },
      });
      mockAxiosInstance.get.mockResolvedValue({
        data: { successful: true, response: { eligible: true } },
      });

      await service.eligible(1_000_000);
      await service.eligible(2_000_000);

      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });

    it('returns error payload when token fetch fails', async () => {
      mockAxiosInstance.post.mockRejectedValue({
        response: { status: 403, data: { errorData: { errorCode: 403 } } },
        message: 'Request failed with status code 403',
      });

      const result = await service.eligible(1_000_000);

      expect(result.successful).toBe(false);
      expect(result.errorData?.message).toContain('Request failed');
      expect(mockStrapi.log.error).toHaveBeenCalled();
    });
  });

  describe('requestPaymentToken', () => {
    it('requests a payment token with normalized payload', async () => {
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

      const payload = {
        amount: 5_000_000,
        discountAmount: 500_000,
        externalSourceAmount: 0,
        mobile: '09123456789',
        paymentMethodTypeDto: 'INSTALLMENT',
        returnURL: 'https://example.com/callback',
        transactionId: 'ORDER-100',
        cartList: [
          {
            cartId: 100,
            cartItems: [
              {
                amount: 4_500_000,
                category: 'پوشاک',
                count: 2,
                id: 1,
                name: 'تی شرت',
                commissionType: 0,
              },
            ],
            isShipmentIncluded: true,
            isTaxIncluded: true,
            taxAmount: 0,
            shippingAmount: 1_000_000,
            totalAmount: 5_000_000,
          },
        ],
      };

      const result = await service.requestPaymentToken(payload as any);

      expect(result.successful).toBe(true);
      expect(result.response?.paymentToken).toBe('payment-token-xyz');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/online/payment/v1/token',
        expect.objectContaining({
          amount: 5_000_000,
          mobile: '+989123456789',
          transactionId: 'ORDER-100',
        }),
        expect.anything(),
      );
    });

    it('bubbles SnappPay error payloads', async () => {
      mockAxiosInstance.post
        .mockResolvedValueOnce({
          data: { access_token: 'token', expires_in: 3600 },
        })
        .mockResolvedValueOnce({
          data: {
            successful: false,
            errorData: { errorCode: 2001, message: 'Invalid cart data' },
          },
        });

      const result = await service.requestPaymentToken({
        amount: 1_000_000,
        discountAmount: 0,
        externalSourceAmount: 0,
        mobile: '09121111111',
        paymentMethodTypeDto: 'INSTALLMENT',
        returnURL: 'https://example.com/callback',
        transactionId: 'ORDER-200',
        cartList: [],
      } as any);

      expect(result.successful).toBe(false);
      expect(result.errorData?.errorCode).toBe(2001);
    });
  });

  describe('verify / settle / revert / status', () => {
    it('verifies a payment token', async () => {
      mockAxiosInstance.post
        .mockResolvedValueOnce({ data: { access_token: 'token', expires_in: 3600 } })
        .mockResolvedValueOnce({
          data: { successful: true, response: { status: 'VERIFIED', transactionId: 'TXN-1' } },
        });

      const result = await service.verify('PT-1');

      expect(result.successful).toBe(true);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/online/payment/v1/verify',
        { paymentToken: 'PT-1' },
        expect.anything(),
      );
    });

    it('settles a verified payment', async () => {
      mockAxiosInstance.post
        .mockResolvedValueOnce({ data: { access_token: 'token', expires_in: 3600 } })
        .mockResolvedValueOnce({
          data: { successful: true, response: { status: 'SETTLED', transactionId: 'TXN-2' } },
        });

      const result = await service.settle('PT-2');

      expect(result.successful).toBe(true);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/online/payment/v1/settle',
        { paymentToken: 'PT-2' },
        expect.anything(),
      );
    });

    it('reverts a payment', async () => {
      mockAxiosInstance.post
        .mockResolvedValueOnce({ data: { access_token: 'token', expires_in: 3600 } })
        .mockResolvedValueOnce({
          data: { successful: true, response: { status: 'REVERTED' } },
        });

      const result = await service.revert('PT-3');

      expect(result.successful).toBe(true);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/online/payment/v1/revert',
        { paymentToken: 'PT-3' },
        expect.anything(),
      );
    });

    it('queries payment status', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { access_token: 'token', expires_in: 3600 },
      });
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { successful: true, response: { status: 'VERIFY_PENDING', transactionId: 'TXN-4' } },
      });

      const result = await service.status('PT-4');

      expect(result.successful).toBe(true);
      expect(result.response?.transactionId).toBe('TXN-4');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/api/online/payment/v1/status',
        expect.objectContaining({
          params: { paymentToken: 'PT-4' },
        }),
      );
    });
  });

  describe('Error handling', () => {
    it('surfaces timeout errors in the response envelope', async () => {
      mockAxiosInstance.post.mockRejectedValueOnce({
        code: 'ECONNABORTED',
        message: 'timeout of 60000ms exceeded',
      });

      const result = await service.eligible(2_000_000);
      expect(result.successful).toBe(false);
      expect(result.errorData?.message).toContain('timeout');
    });

    it('uses staging endpoint from environment', () => {
      expect(process.env.SNAPPAY_BASE_URL).toBe(
        'https://fms-gateway-staging.apps.public.okd4.teh-1.snappcloud.io',
      );
    });
  });
});
