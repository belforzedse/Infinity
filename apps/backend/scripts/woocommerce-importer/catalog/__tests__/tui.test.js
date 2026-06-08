"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

test("tui module can be required without running main", () => {
  const tui = require("../tui");
  assert.equal(typeof tui.main, "function");
  assert.equal(typeof tui.buildCustomRunOpts, "function");
});

test("buildCustomRunOpts accepts each valid scope", () => {
  const { buildCustomRunOpts } = require("../tui");
  for (const scope of ["full", "no-media", "categories", "stock", "price", "media"]) {
    const opts = buildCustomRunOpts({ scope, dryRun: "y", skipMedia: "n", limit: "" });
    assert.equal(opts.scope, scope);
    assert.equal(opts.dryRun, true);
    assert.equal(opts.skipMedia, false);
    assert.equal(opts.limit, Infinity);
  }
});

test("buildCustomRunOpts rejects invalid scopes", () => {
  const { buildCustomRunOpts } = require("../tui");
  assert.throws(
    () => buildCustomRunOpts({ scope: "unknown", dryRun: "y", skipMedia: "n", limit: "" }),
    /Invalid scope/,
  );
});

test("buildCustomRunOpts parses numeric limits", () => {
  const { buildCustomRunOpts } = require("../tui");
  const opts = buildCustomRunOpts({ scope: "stock", dryRun: "n", skipMedia: "y", limit: "25" });
  assert.equal(opts.limit, 25);
  assert.equal(opts.dryRun, false);
  assert.equal(opts.skipMedia, true);
});

test("buildCustomRunOpts rejects bad limits", () => {
  const { buildCustomRunOpts } = require("../tui");
  for (const limit of ["0", "-1", "abc", "1.5"]) {
    assert.throws(
      () => buildCustomRunOpts({ scope: "full", dryRun: "y", skipMedia: "n", limit }),
      /Limit must be a positive integer/,
    );
  }
});

test("buildCustomRunOpts normalizes boolean inputs", () => {
  const { buildCustomRunOpts } = require("../tui");
  assert.deepEqual(
    buildCustomRunOpts({ scope: "media", dryRun: true, skipMedia: false, limit: undefined }),
    { scope: "media", dryRun: true, skipMedia: false, limit: Infinity },
  );
  assert.deepEqual(
    buildCustomRunOpts({ scope: "media", dryRun: "false", skipMedia: "1", limit: null }),
    { scope: "media", dryRun: false, skipMedia: true, limit: Infinity },
  );
});
