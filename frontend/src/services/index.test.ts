import ApiClient, { apiClient } from './index';
import { ERROR_MESSAGES, HTTP_STATUS } from '@/constants/api';
import { handleAuthErrors } from '@/utils/auth';

jest.mock('@/utils/auth', () => ({
  handleAuthErrors: jest.fn(),
}));

describe('ApiClient error handling', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    (handleAuthErrors as jest.Mock).mockClear();
    mockFetch.mockReset();
    global.fetch = mockFetch as any;
  });

  it('calls handleAuthErrors on unauthorized response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: HTTP_STATUS.UNAUTHORIZED,
      json: async () => ({}),
    });

    await expect(apiClient.get('/test')).rejects.toEqual({
      message: ERROR_MESSAGES.DEFAULT,
      status: HTTP_STATUS.UNAUTHORIZED,
      errors: undefined,
    });

    expect(handleAuthErrors).toHaveBeenCalledWith({
      message: ERROR_MESSAGES.DEFAULT,
      status: HTTP_STATUS.UNAUTHORIZED,
      errors: undefined,
    });

  });

  it('preserves 400 error structure and skips auth handler', async () => {
    const error = { error: { message: 'Invalid data' } };
    mockFetch.mockResolvedValue({
      ok: false,
      status: HTTP_STATUS.BAD_REQUEST,
      json: async () => error,
    });

    await expect(apiClient.post('/test', {})).rejects.toEqual({
      status: HTTP_STATUS.BAD_REQUEST,
      message: 'Invalid data',
      error: error.error,
    });
  });

  it('throws when baseUrl is missing', async () => {
    const client = new ApiClient();
    (client as any).baseUrl = undefined;

    await expect(client.get('/test')).rejects.toEqual({
      message: 'API base URL is not configured',
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      errors: undefined,
    });
  });
});
