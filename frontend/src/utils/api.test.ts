import { describe, expect, test } from '@jest/globals';

import { handleApiError, parseJwt } from './api.ts';
import { ERROR_MESSAGES } from '../constants/api.ts';

describe('handleApiError', () => {
  test('handles network error without navigator', () => {
    const originalNavigator = (global as any).navigator;
    // ensure navigator is undefined
    delete (global as any).navigator;

    const result = handleApiError({ message: 'Network Error' });
    expect(result).toEqual({ message: ERROR_MESSAGES.NETWORK, status: 0 });

    if (originalNavigator !== undefined) {
      (global as any).navigator = originalNavigator;
    } else {
      delete (global as any).navigator;
    }
  });

  test('handles offline navigator', () => {
    const originalNavigator = (global as any).navigator;
    (global as any).navigator = { onLine: false };

    const result = handleApiError({ message: 'Some error' });
    expect(result).toEqual({ message: ERROR_MESSAGES.NETWORK, status: 0 });

    if (originalNavigator !== undefined) {
      (global as any).navigator = originalNavigator;
    } else {
      delete (global as any).navigator;
    }
  });
});

describe('parseJwt', () => {
  test('decodes token on client using atob', () => {
    const payload = { baz: 'qux' };
    const base64Url = Buffer.from(JSON.stringify(payload))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    const token = `header.${base64Url}.signature`;

    const originalWindow = (global as any).window;
    const originalAtob = (global as any).atob;
    let called = false;
    (global as any).window = {};
    (global as any).atob = (input: string) => {
      called = true;
      return Buffer.from(input, 'base64').toString('binary');
    };

    const result = parseJwt(token);
    expect(result).toEqual(payload);
    expect(called).toBe(true);

    if (originalWindow !== undefined) {
      (global as any).window = originalWindow;
    } else {
      delete (global as any).window;
    }
    if (originalAtob !== undefined) {
      (global as any).atob = originalAtob;
    } else {
      delete (global as any).atob;
    }
  });
});
