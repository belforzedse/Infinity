"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { validateMediaUrl, isPrivateHost } = require("../lib/safeUrl");

test("validateMediaUrl: allows public https", () => {
  const r = validateMediaUrl("https://cdn.example.com/a.jpg");
  assert.equal(r.ok, true);
});

test("validateMediaUrl: blocks http by default, allows when allowHttp", () => {
  assert.equal(validateMediaUrl("http://cdn.example.com/a.jpg").ok, false);
  assert.equal(validateMediaUrl("http://cdn.example.com/a.jpg", { allowHttp: true }).ok, true);
});

test("validateMediaUrl: blocks SSRF targets (loopback, private, metadata)", () => {
  for (const url of [
    "https://127.0.0.1/x.jpg",
    "https://localhost/x.jpg",
    "https://10.0.0.5/x.jpg",
    "https://192.168.1.10/x.jpg",
    "https://172.16.0.1/x.jpg",
    "https://169.254.169.254/latest/meta-data/",
    "https://[::1]/x.jpg",
  ]) {
    assert.equal(validateMediaUrl(url, { allowHttp: true }).ok, false, `should block ${url}`);
  }
});

test("validateMediaUrl: rejects malformed/empty URLs", () => {
  assert.equal(validateMediaUrl("not a url").ok, false);
  assert.equal(validateMediaUrl("").ok, false);
  assert.equal(validateMediaUrl(null).ok, false);
});

test("isPrivateHost: public hostnames pass", () => {
  assert.equal(isPrivateHost("cdn.example.com"), false);
  assert.equal(isPrivateHost("8.8.8.8"), false);
});
