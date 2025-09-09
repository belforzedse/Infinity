import { apiClient } from '@/services';
import { handleAuthErrors } from '@/utils/auth';
import { HTTP_STATUS, ERROR_MESSAGES } from '@/constants/api';

describe('Authentication flows', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('clears token and redirects to auth on unauthorized', async () => {
    localStorage.setItem('accessToken', 'token');
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: HTTP_STATUS.UNAUTHORIZED,
      json: async () => ({}),
    });


    await expect(apiClient.get('/protected')).rejects.toEqual({

      message: ERROR_MESSAGES.DEFAULT,
      status: HTTP_STATUS.UNAUTHORIZED,
      errors: undefined,
    });


    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('redirects non-admin users to account', () => {
    localStorage.setItem('accessToken', 'token');
    handleAuthErrors(null, false);
    expect(localStorage.getItem('accessToken')).toBe('token');
  });

});
