"use strict";

/**
 * Pure helpers for retry/backoff decisions. Kept side-effect free so they can be
 * unit-tested deterministically (a `random` function is injected).
 */

/**
 * Compute the delay (ms) before the next retry attempt using capped exponential
 * backoff with optional "full jitter".
 *
 * @param {number} attempt 1-based attempt number that just failed
 * @param {object} [opts]
 * @param {number} [opts.baseDelay=1000]
 * @param {number} [opts.maxDelay=30000]
 * @param {number} [opts.factor=2]
 * @param {boolean} [opts.jitter=true]
 * @param {() => number} [opts.random=Math.random]
 * @returns {number} delay in milliseconds
 */
function computeBackoffDelay(attempt, opts = {}) {
  const {
    baseDelay = 1000,
    maxDelay = 30000,
    factor = 2,
    jitter = true,
    random = Math.random,
  } = opts;

  const exp = Math.min(maxDelay, baseDelay * Math.pow(factor, Math.max(0, attempt - 1)));
  if (!jitter) {
    return Math.round(exp);
  }
  // Full jitter: random value in [0, exp]
  return Math.round(random() * exp);
}

/**
 * Parse an HTTP `Retry-After` header (seconds or HTTP-date) into milliseconds.
 * @param {string|number|undefined|null} value
 * @param {() => number} [now=Date.now]
 * @returns {number|null} milliseconds to wait, or null if unparseable
 */
function parseRetryAfter(value, now = Date.now) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const asSeconds = Number(value);
  if (Number.isFinite(asSeconds)) {
    return Math.max(0, Math.round(asSeconds * 1000));
  }
  const asDate = Date.parse(value);
  if (Number.isFinite(asDate)) {
    return Math.max(0, asDate - now());
  }
  return null;
}

const RETRYABLE_NETWORK_CODES = new Set([
  "ECONNRESET",
  "ETIMEDOUT",
  "ECONNREFUSED",
  "ENOTFOUND",
  "EAI_AGAIN",
  "EPIPE",
  "ECONNABORTED",
]);

/**
 * Decide whether a failed request should be retried.
 *
 * Retries: network errors, HTTP 429, and HTTP >= 500. For requests with a body
 * (POST/PATCH) we still allow retry on network/429/5xx because the importer's
 * writes are idempotent (upsert by external_id) — but never on 4xx (validation),
 * which would just waste attempts.
 *
 * @param {object} error axios-style error ({ code, response: { status } })
 * @returns {boolean}
 */
function isRetryableError(error) {
  if (!error) {
    return false;
  }
  if (error.code && RETRYABLE_NETWORK_CODES.has(error.code)) {
    return true;
  }
  const status = error.response?.status;
  if (typeof status === "number") {
    if (status === 429) return true;
    if (status >= 500 && status <= 599) return true;
    return false; // any other HTTP response (incl. 4xx) is not retryable
  }
  // No response and no recognised code → treat generic network failure as retryable
  return Boolean(error.request) || error.code === undefined;
}

module.exports = {
  computeBackoffDelay,
  parseRetryAfter,
  isRetryableError,
  RETRYABLE_NETWORK_CODES,
};
