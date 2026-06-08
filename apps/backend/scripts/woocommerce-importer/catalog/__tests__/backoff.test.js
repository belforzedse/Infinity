"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { computeBackoffDelay, parseRetryAfter, isRetryableError } = require("../lib/backoff");

test("computeBackoffDelay: exponential without jitter, capped at maxDelay", () => {
  const opts = { baseDelay: 1000, factor: 2, maxDelay: 8000, jitter: false };
  assert.equal(computeBackoffDelay(1, opts), 1000);
  assert.equal(computeBackoffDelay(2, opts), 2000);
  assert.equal(computeBackoffDelay(3, opts), 4000);
  assert.equal(computeBackoffDelay(4, opts), 8000);
  assert.equal(computeBackoffDelay(5, opts), 8000); // capped
});

test("computeBackoffDelay: full jitter stays within [0, exp]", () => {
  const delay = computeBackoffDelay(3, {
    baseDelay: 1000,
    factor: 2,
    maxDelay: 30000,
    jitter: true,
    random: () => 0.5,
  });
  assert.equal(delay, 2000); // 0.5 * 4000
});

test("parseRetryAfter: seconds, HTTP-date, and invalid", () => {
  assert.equal(parseRetryAfter("2"), 2000);
  assert.equal(parseRetryAfter(0), 0);
  const future = new Date(Date.now() + 5000).toUTCString();
  const ms = parseRetryAfter(future, () => Date.now());
  assert.ok(ms >= 3000 && ms <= 6000);
  assert.equal(parseRetryAfter("garbage"), null);
  assert.equal(parseRetryAfter(undefined), null);
});

test("isRetryableError: retry network, 429, 5xx; never 4xx", () => {
  assert.equal(isRetryableError({ code: "ECONNRESET" }), true);
  assert.equal(isRetryableError({ code: "ETIMEDOUT" }), true);
  assert.equal(isRetryableError({ response: { status: 429 } }), true);
  assert.equal(isRetryableError({ response: { status: 503 } }), true);
  assert.equal(isRetryableError({ response: { status: 500 } }), true);
  assert.equal(isRetryableError({ response: { status: 400 } }), false);
  assert.equal(isRetryableError({ response: { status: 404 } }), false);
  assert.equal(isRetryableError({ response: { status: 409 } }), false);
});
