import { test } from 'node:test';
import assert from 'node:assert/strict';

import { handleApiError, parseJwt } from './api.ts';
import { ERROR_MESSAGES } from '../constants/api.ts';

test('handleApiError handles network error without navigator', () => {
  const originalNavigator = (global as any).navigator;
  // ensure navigator is undefined
  delete (global as any).navigator;

  const result = handleApiError({ message: 'Network Error' });
  assert.deepEqual(result, { message: ERROR_MESSAGES.NETWORK, status: 0 });

  if (originalNavigator !== undefined) {
    (global as any).navigator = originalNavigator;
  } else {
    delete (global as any).navigator;
  }
});

test('handleApiError handles offline navigator', () => {
  const originalNavigator = (global as any).navigator;
  (global as any).navigator = { onLine: false };

  const result = handleApiError({ message: 'Some error' });
  assert.deepEqual(result, { message: ERROR_MESSAGES.NETWORK, status: 0 });

  if (originalNavigator !== undefined) {
    (global as any).navigator = originalNavigator;
  } else {
    delete (global as any).navigator;
  }
});

test('parseJwt decodes token on server using Buffer', () => {
  const payload = { foo: 'bar' };
  const base64Url = Buffer.from(JSON.stringify(payload))
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  const token = `header.${base64Url}.signature`;

  const originalWindow = (global as any).window;
  const originalAtob = (global as any).atob;
  // ensure server context
  delete (global as any).window;
  (global as any).atob = () => {
    throw new Error('atob should not be used on server');
  };

  const result = parseJwt(token);
  assert.deepEqual(result, payload);

  if (originalWindow !== undefined) {
    (global as any).window = originalWindow;
  }
  if (originalAtob !== undefined) {
    (global as any).atob = originalAtob;
  } else {
    delete (global as any).atob;
  }
});

test('parseJwt decodes token on client using atob', () => {
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
  assert.deepEqual(result, payload);
  assert.equal(called, true);

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
