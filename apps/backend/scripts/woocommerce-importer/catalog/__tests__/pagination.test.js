"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const WooSource = require("../lib/wooSource");

/** Build a mock HttpClient whose /products returns the given pages keyed by page number. */
function mockHttp(pagesByNumber, totalPages) {
  return {
    calls: [],
    async get(url, config = {}) {
      const page = config.params?.page ?? 1;
      this.calls.push(page);
      return {
        data: pagesByNumber[page] || [],
        headers: { "x-wp-totalpages": String(totalPages) },
      };
    },
  };
}

async function collect(iter) {
  const out = [];
  for await (const item of iter) out.push(item);
  return out;
}

test("iterateProducts: collects every page including the last partial page", async () => {
  const http = mockHttp(
    { 1: [{ id: 1 }, { id: 2 }], 2: [{ id: 3 }, { id: 4 }], 3: [{ id: 5 }] },
    3,
  );
  const woo = new WooSource(http, { defaultPerPage: 2 });
  const items = await collect(woo.iterateProducts());
  assert.deepEqual(items.map((p) => p.id), [1, 2, 3, 4, 5]);
  assert.deepEqual(http.calls, [1, 2, 3]);
});

test("iterateProducts: does NOT stop early on a short/empty middle page", async () => {
  const http = mockHttp({ 1: [{ id: 1 }], 2: [], 3: [{ id: 3 }] }, 3);
  const woo = new WooSource(http, { defaultPerPage: 1 });
  const items = await collect(woo.iterateProducts());
  // The legacy importer broke on the empty page 2 and lost page 3 — this must not.
  assert.deepEqual(items.map((p) => p.id), [1, 3]);
});

test("iterateProducts: single page when totalpages header absent", async () => {
  const http = {
    calls: [],
    async get(url, config = {}) {
      this.calls.push(config.params?.page ?? 1);
      return { data: [{ id: 1 }], headers: {} };
    },
  };
  const woo = new WooSource(http);
  const items = await collect(woo.iterateProducts());
  assert.deepEqual(items.map((p) => p.id), [1]);
  assert.deepEqual(http.calls, [1]);
});

test("iterateVariations: walks all variation pages", async () => {
  const http = {
    async get(url, config = {}) {
      const page = config.params?.page ?? 1;
      const pages = { 1: [{ id: 10 }, { id: 11 }], 2: [{ id: 12 }] };
      return { data: pages[page] || [], headers: { "x-wp-totalpages": "2" } };
    },
  };
  const woo = new WooSource(http, { defaultPerPage: 2 });
  const items = await collect(woo.iterateVariations(101));
  assert.deepEqual(items.map((v) => v.id), [10, 11, 12]);
});
