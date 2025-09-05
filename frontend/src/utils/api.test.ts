import { describe, expect, test } from '@jest/globals';

import { handleApiError, parseJwt } from './api.ts';
import { ERROR_MESSAGES } from '../constants/api.ts';

interface MutableGlobal extends NodeJS.Global {
  navigator?: { onLine?: boolean };
  window?: unknown;
  atob?: (input: string) => string;
}

const g = globalThis as MutableGlobal;

describe('handleApiError', () => {
  test('handles network error without navigator', () => {
    const originalNavigator = g.navigator;
    // ensure navigator is undefined
    delete g.navigator;

    const result = handleApiError({ message: 'Network Error' });
    expect(result).toEqual({ message: ERROR_MESSAGES.NETWORK, status: 0 });

    if (originalNavigator !== undefined) {
      g.navigator = originalNavigator;
    } else {
      delete g.navigator;
    }
  });

  test('handles offline navigator', () => {
    const originalNavigator = g.navigator;
    g.navigator = { onLine: false };

    const result = handleApiError({ message: 'Some error' });
    expect(result).toEqual({ message: ERROR_MESSAGES.NETWORK, status: 0 });

    if (originalNavigator !== undefined) {
      g.navigator = originalNavigator;
    } else {
      delete g.navigator;
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

    const originalWindow = g.window;
    const originalAtob = g.atob;
    let called = false;
    g.window = {};
    g.atob = (input: string) => {
      called = true;
      return Buffer.from(input, 'base64').toString('binary');
    };

    const result = parseJwt(token);
    expect(result).toEqual(payload);
    expect(called).toBe(true);

    if (originalWindow !== undefined) {
      g.window = originalWindow;
    } else {
      delete g.window;
    }
    if (originalAtob !== undefined) {
      g.atob = originalAtob;
    } else {
      delete g.atob;
    }
  });
});
