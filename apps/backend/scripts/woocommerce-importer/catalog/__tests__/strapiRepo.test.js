"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const StrapiRepo = require("../lib/strapiRepo");

const noopLogger = { info() {}, debug() {}, warn() {}, error() {} };

function mockHttp() {
  return {
    posts: [],
    puts: [],
    gets: [],
    nextPostId: 1000,
    async post(url, body) {
      this.posts.push({ url, body });
      return { data: { data: { id: this.nextPostId++ } } };
    },
    async put(url, body) {
      this.puts.push({ url, body });
      return { data: { data: { id: Number(url.split("/").pop()) } } };
    },
    async get(url, config) {
      this.gets.push({ url, config });
      return { data: { data: [] } };
    },
  };
}

test("upsert: creates when external_id not in index (POST), records id in index", async () => {
  const http = mockHttp();
  const repo = new StrapiRepo(http, noopLogger);
  const index = new Map();
  const r = await repo.upsert({
    endpoint: "/product-variations",
    externalId: "201",
    payload: { SKU: "BAG-RED-M", Price: 1000000 },
    index,
  });
  assert.equal(r.mode, "created");
  assert.equal(http.posts.length, 1);
  assert.equal(http.puts.length, 0);
  assert.equal(index.get("201").id, r.id);
});

test("upsert: updates when external_id already indexed (PUT), no SKU mutation", async () => {
  const http = mockHttp();
  const repo = new StrapiRepo(http, noopLogger);
  const index = new Map([["201", { id: 777 }]]);
  const payload = { SKU: "BAG-RED-M", Price: 1000000 };
  const r = await repo.upsert({ endpoint: "/product-variations", externalId: "201", payload, index });
  assert.equal(r.mode, "updated");
  assert.equal(r.id, 777);
  assert.equal(http.posts.length, 0);
  assert.equal(http.puts.length, 1);
  // The SKU sent on update is exactly the input — never suffixed/mutated across runs.
  assert.equal(http.puts[0].body.data.SKU, "BAG-RED-M");
});

test("upsert: second run with same external_id is idempotent (update, not duplicate)", async () => {
  const http = mockHttp();
  const repo = new StrapiRepo(http, noopLogger);
  const index = new Map();
  const args = { endpoint: "/products", externalId: "101", payload: { Title: "Bag" }, index };
  const first = await repo.upsert(args);
  const second = await repo.upsert(args);
  assert.equal(first.mode, "created");
  assert.equal(second.mode, "updated");
  assert.equal(http.posts.length, 1); // only ONE create across two runs
  assert.equal(http.puts.length, 1);
});

test("upsert: recovers from unique-constraint race (POST 400 → findByExternalId → PUT)", async () => {
  const http = mockHttp();
  http.post = async () => {
    const err = new Error("duplicate");
    err.response = { status: 400 };
    throw err;
  };
  http.get = async () => ({ data: { data: [{ id: 555 }] } });
  const repo = new StrapiRepo(http, noopLogger);
  const r = await repo.upsert({
    endpoint: "/products",
    externalId: "101",
    payload: { Title: "Bag" },
    index: new Map(),
  });
  assert.equal(r.mode, "updated");
  assert.equal(r.id, 555);
});

test("resolveAttributeId: caches and creates once", async () => {
  const http = mockHttp();
  const repo = new StrapiRepo(http, noopLogger);
  const id1 = await repo.resolveAttributeId({ type: "size", title: "M", externalId: "size_m" });
  const id2 = await repo.resolveAttributeId({ type: "size", title: "M", externalId: "size_m" });
  assert.equal(id1, id2);
  assert.equal(http.posts.length, 1); // second call hits cache, no extra POST
});
