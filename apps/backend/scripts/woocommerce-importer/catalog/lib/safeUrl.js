"use strict";

/**
 * SSRF guard for media downloads.
 *
 * Media URLs come from WooCommerce product data. If WooCommerce is compromised (or
 * a product is edited maliciously) an image `src` could point at an internal host
 * (`http://127.0.0.1:6379`, the cloud metadata endpoint `169.254.169.254`, etc.).
 * The legacy `ImageUploader` downloaded whatever URL it was given, following
 * redirects, with no validation. This module rejects unsafe URLs before any
 * network call is made.
 */

/**
 * @param {string} hostname
 * @returns {boolean} true if the host is a private/loopback/link-local/reserved address
 */
function isPrivateHost(hostname) {
  if (!hostname) {
    return true;
  }
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, ""); // strip IPv6 brackets

  if (host === "localhost" || host.endsWith(".localhost")) {
    return true;
  }

  // IPv6 loopback / unique-local / link-local
  if (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80")) {
    return true;
  }

  // IPv4-mapped or dotted-quad
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // loopback
    if (a === 0) return true; // 0.0.0.0/8
    if (a === 169 && b === 254) return true; // link-local incl. 169.254.169.254 metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
    if (a >= 224) return true; // multicast / reserved
  }

  return false;
}

/**
 * Validate a media URL. Returns `{ ok: true, url }` or `{ ok: false, reason }`.
 *
 * @param {string} rawUrl
 * @param {object} [opts]
 * @param {string[]} [opts.allowedProtocols=["https:"]]
 * @param {boolean} [opts.allowHttp=false] allow plain http (e.g. for a local sandbox)
 * @returns {{ ok: true, url: URL } | { ok: false, reason: string }}
 */
function validateMediaUrl(rawUrl, opts = {}) {
  const { allowHttp = false } = opts;
  const allowedProtocols = opts.allowedProtocols || (allowHttp ? ["https:", "http:"] : ["https:"]);

  if (!rawUrl || typeof rawUrl !== "string") {
    return { ok: false, reason: "empty or non-string URL" };
  }

  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, reason: `invalid URL: ${rawUrl}` };
  }

  if (!allowedProtocols.includes(url.protocol)) {
    return { ok: false, reason: `protocol not allowed: ${url.protocol}` };
  }

  if (isPrivateHost(url.hostname)) {
    return { ok: false, reason: `host not allowed (private/loopback/metadata): ${url.hostname}` };
  }

  return { ok: true, url };
}

module.exports = { validateMediaUrl, isPrivateHost };
