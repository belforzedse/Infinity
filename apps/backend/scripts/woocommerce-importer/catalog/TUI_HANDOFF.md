# Handoff: Build the Catalog Importer TUI (`catalog/tui.js`)

**Audience:** an engineer/agent implementing the interactive terminal UI for the new
catalog importer. You do **not** need prior context — everything required is here.

**Working dir:** `apps/backend/scripts/woocommerce-importer/`
**Runtime:** Node ≥ 18 (CI uses Node 22). Deps already installed: `commander`, `axios`,
`sharp`, `form-data`. No new dependencies.

---

## 0. The one hard invariant

**WooCommerce is the READ-ONLY source of truth. Strapi is the only writable target.**
The TUI must never offer an action that writes to WooCommerce. Show this line in the header.

---

## 1. What already exists (use it — do not reimplement)

The new idempotent engine is built and unit-tested (70 passing tests). Your job is only
the interactive front-end that drives it. Key modules:

### `catalog/config.js`
```js
const { buildConfig } = require("./config");
const { config } = buildConfig(envName); // envName: "production" | "staging" | "local"
```
- Reads env vars and throws if the Strapi token for that env is missing
  (`STRAPI_API_TOKEN_PRODUCTION | _STAGING | _LOCAL`).
- Sets `config.strapi.baseUrl`, `config.duplicateTracking.storageDir`
  (`./import-tracking/<env>`), `config.catalog.*`, etc. **Use this — do not hardcode URLs.**

### `catalog/engine.js`
```js
const { CatalogEngine } = require("./engine");
const engine = new CatalogEngine(config, logger, { environment: envName });

// Sync / scoped sync. Returns an ImportReport (already printed + saved to disk inside).
const report = await engine.runSync({
  dryRun: false,        // true = preview, no writes
  scope: "full",        // full | no-media | categories | stock | price | media
  skipMedia: false,     // only relevant to full/no-media
  limit: Infinity,      // max products to process
});
report.hasFailures();   // boolean
report.toJSON();        // { runAt, command, durationMs, entities{...}, media{...}, failures[] }

// Read-only comparison.
const { ok, wcOnly, strapiOnly } = await engine.runVerify({ limit: Infinity });
```
`runSync` internally calls `preflight()` (connectivity check), `report.printSummary()` and
`report.save()` (writes `import-tracking/<env>/sync-reports/<command>-<ts>.json`) and logs
`Report saved: <path>`.

### `catalog/lib/presets.js` (pure, already tested)
```js
const { PRESETS, resolvePreset, resolveScope } = require("./lib/presets");
```
`PRESETS` is the **menu source of truth** — render it directly. Each entry:
```js
{ id, label, description, run?: { scope, dryRun? }, verify?: true, confirm: boolean }
```
Current entries (ids): `full`, `no-media`, `dry-run`, `stock`, `price`, `media`,
`categories`, `verify`.
- `confirm: true` → a **live** (non-dry) run must be typed-confirmed before executing.
- `verify: true` → call `engine.runVerify(...)`, not `runSync`.

### `catalog/utils` (reuse)
```js
const Logger = require("../utils/Logger");   // new Logger(config.logging)
```

---

## 2. What to build

Create **`catalog/tui.js`** — a thin `readline`-based menu loop. Also add a
`catalog:tui` script to `package.json` (`"catalog:tui": "node catalog/tui.js"`).

Guard the entry point so the module can be required by a test without running:
```js
if (require.main === module) main();
```

### Flow

1. **Preconditions:** require `WOOCOMMERCE_CONSUMER_KEY` and `WOOCOMMERCE_CONSUMER_SECRET`
   in env (mirror `catalog/cli.js`’s `requireEnv`). If missing, print how to set them and exit.
   Optionally load `apps/backend/.env` first (copy the `dotenv` block from `catalog/cli.js`).
2. **Select environment** (`production | staging | local`, default `local`). Call
   `buildConfig(env)`; if it throws (missing token), show the message and let the user pick again.
   Build `logger` + `engine`. Show the Strapi base URL.
3. **Main menu** (loop). Render in three groups:
   - **Catalog presets** — iterate `PRESETS` and list `label` + `description`.
   - **Custom…** — let the user choose `scope` (from `resolveScope`’s valid list:
     full/no-media/categories/stock/price/media), `dryRun` (y/n), `skipMedia` (y/n),
     `limit` (blank = all). Then run like a preset.
   - **Legacy (bridge)** — Orders, Users, Blog posts, Sync shipping locations,
     Dedup variations, Full dedup. (See §3.)
   - **Utilities** — Change environment, View last report / status, Exit.
4. **Running a preset:**
   - If `preset.verify` → `await engine.runVerify({ limit })`; print `ok`, counts, and a few
     `wcOnly` ids.
   - Else build `runOpts` from `preset.run`, optionally prompt for `limit`. If the run is
     **live** (`!runOpts.dryRun`) **and** `preset.confirm`, require the user to type the
     scope name (e.g. `full`) to confirm. Then `await engine.runSync(runOpts)`.
   - After any run: print a compact summary from `report.toJSON()` (entities + media +
     duration) and the saved report path. (`runSync` logs the path; you may also re-derive
     it from `config.catalog.trackingDirAbs + "/sync-reports"`. Do **not** call
     `report.save()` again — it already saved.)
5. Catch errors per action so one failure returns to the menu, not crashes the process.
   Always `rl.close()` on exit.

### Confirmation rule (safety)

Before any **live write** (non-dry `runSync`), show: environment, Strapi URL, scope, and
limit; require typed confirmation. Dry-run and verify need no confirmation.

---

## 3. Legacy bridge (non-catalog flows — reuse, do not rewrite)

The new engine is catalog-only. For these, delegate to the **existing** modules (same ones
the old `interactive.js` uses). They accept `(config, logger)` built from `buildConfig`:

```js
const OrderImporter   = require("../importers/OrderImporter");
const UserImporter    = require("../importers/UserImporter");
const BlogPostImporter= require("../importers/BlogPostImporter");
const { syncShippingLocations } = require("../utils/ShippingSeeder");
const { dedup, fullDedup } = require("../dedup-variations-by-external-id");
```
- Orders/Users/Blog: `new XImporter(config, logger).import({ limit, page, dryRun, ... })`.
- Shipping: `await syncShippingLocations(config, logger)`.
- Dedup: `await dedup({ dryRun })` / `await fullDedup({ dryRun })` (default dry-run = true;
  require typing `dedup` / `full-dedup` to run live — copy the prompts from
  `interactive.js` lines ~1096–1203).

Copy the prompt/confirmation patterns from the existing `interactive.js` for these.

---

## 4. Bugs in the OLD `interactive.js` — do NOT repeat them

1. It instantiates the **legacy** `ProductImporter`/`VariationImporter` (all the bugs we
   rewrote). **Use `CatalogEngine` for all catalog work.**
2. `maxImagesPerProduct: 3` default silently truncated galleries. **Don’t cap gallery
   images** — the engine defaults to effectively unlimited via
   `config.import.images.maxImagesPerProduct`.
3. Strapi health check used `{ pagination: { pageSize: 1 } }` (wrong shape). **Don’t write
   your own health check — `runSync`/`runVerify` already call `engine.preflight()`.**
4. Hardcoded staging URLs are inconsistent and drift over time. **Always use
   `buildConfig(env)`; never hardcode URLs.**
5. Default کیف/کفش name filter silently dropped most products. **The new engine has no name
   filter — do not add one.**
6. No structured report shown. **Always surface `report.toJSON()` + saved path.**

---

## 5. Acceptance criteria

- `node catalog/tui.js` launches, asks for environment, shows a menu with the read-only
  banner, all `PRESETS`, Custom, the legacy bridge items, and Exit.
- Selecting **Catalog Dry-Run** runs `runSync({ scope:"full", dryRun:true })` and prints a
  summary with zero writes (safe even against production).
- Selecting **Verify** runs `runVerify` and prints `wcOnly`/`strapiOnly` counts.
- A live preset (e.g. **Stock Sync**) requires typed confirmation showing env + scope, then
  runs `runSync({ scope:"stock" })`.
- **Custom…** can produce any valid scope; invalid scope is rejected with a message.
- One failing action returns to the menu (no crash); Ctrl-C / Exit closes cleanly.
- `npm test` still passes (don’t break existing tests). If you extract any pure helper
  (e.g. a `buildCustomRunOpts({scope,dryRun,skipMedia,limit})` validator), add a
  `catalog/__tests__/tui.test.js` that requires `tui.js` (it must not run `main()` on
  require) and unit-tests that helper. Keep the readline loop itself thin and out of tests.

## 6. How to run / verify your work

```bash
cd apps/backend/scripts/woocommerce-importer
npm test                                   # must stay green
node catalog/tui.js                        # manual: pick Dry-Run, then Verify
# with creds set (WOOCOMMERCE_CONSUMER_KEY/SECRET + STRAPI_API_TOKEN_LOCAL):
#   choose env=local → Catalog Dry-Run → confirm summary prints, no writes
```

Reference implementations to read first:
- `catalog/cli.js` — env loading, `requireEnv`, building config+logger+engine, calling
  `runSync`/`runVerify`. The TUI is essentially an interactive wrapper around this.
- `catalog/lib/presets.js` — the menu data + scope semantics.
- `interactive.js` — the OLD TUI: copy its readline `prompt()` helper and the legacy-bridge
  prompts, but replace all catalog logic with `CatalogEngine`.
