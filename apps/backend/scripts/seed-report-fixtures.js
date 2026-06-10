#!/usr/bin/env node
/**
 * Seed deterministic order/contract/transaction fixtures for verifying the
 * product reporting endpoints (/reports/products/*).
 *
 * The fixtures reference EXISTING product variations (the DB already has imported
 * products) and add orders that exercise every reporting edge case: a clean paid
 * order, a paid order with a partial refund, a Paying order (no successful
 * settlement), a fully-refunded/cancelled order, and one order in the previous
 * comparison period.
 *
 * Every row is tagged `external_source = 'report-fixture'` and uses fixed ids in a
 * high range, so the script is idempotent and fully reversible:
 *
 *   node scripts/seed-report-fixtures.js            # (re)seed
 *   node scripts/seed-report-fixtures.js --teardown # remove all fixtures
 *
 * Connection is read from the standard backend env (DATABASE_HOST/PORT/NAME/...).
 * It refuses to run against a production database unless --force is passed.
 *
 * Expected totals for the window 2026-05-01 .. 2026-05-31 (see EXPECTED below)
 * are printed after seeding so they can be reconciled against the API output.
 */

const path = require("path");
try {
  require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
} catch {
  /* dotenv optional */
}
const { Client } = require("pg");

const TAG = "report-fixture";

// Existing variations in the local catalog (see scripts/homepage-query-plans.js).
const V1 = 2; // product 5, شلوار, stock 1
const V2 = 6; // product 7, شال,   stock 0
const V3 = 3; // product 5, شلوار, stock 0

const TITLE_P5 = "شلوار مازراتی پیله ای R 00124";
const TITLE_P7 = "شال پلیسه s 00157";

const orders = [
  { id: 901, status: "Done", date: "2026-05-05", discount: 0 },
  { id: 902, status: "Shipment", date: "2026-05-10", discount: 200000 },
  { id: 903, status: "Paying", date: "2026-05-12", discount: 0 },
  { id: 904, status: "Cancelled", date: "2026-05-15", discount: 0 },
  { id: 905, status: "Done", date: "2026-04-20", discount: 0 }, // previous period
];

const orderItems = [
  { id: 90101, order: 901, variation: V1, count: 2, per: 800000, title: TITLE_P5, sku: "WC-617901-1147339" },
  { id: 90102, order: 901, variation: V2, count: 1, per: 350000, title: TITLE_P7, sku: "WC-637504-637516" },
  { id: 90201, order: 902, variation: V1, count: 1, per: 800000, title: TITLE_P5, sku: "WC-617901-1147339" },
  { id: 90202, order: 902, variation: V3, count: 3, per: 800000, title: TITLE_P5, sku: "WC-617901-1147338" },
  { id: 90301, order: 903, variation: V2, count: 5, per: 350000, title: TITLE_P7, sku: "WC-637504-637516" },
  { id: 90401, order: 904, variation: V1, count: 1, per: 800000, title: TITLE_P5, sku: "WC-617901-1147339" },
  { id: 90501, order: 905, variation: V2, count: 2, per: 350000, title: TITLE_P7, sku: "WC-637504-637516" },
];

const contracts = [
  { id: 9101, order: 901, status: "Finished", amount: 1950000, date: "2026-05-05" },
  { id: 9102, order: 902, status: "Finished", amount: 3000000, date: "2026-05-10" },
  { id: 9103, order: 903, status: "Not Ready", amount: 1750000, date: "2026-05-12" },
  { id: 9104, order: 904, status: "Cancelled", amount: 800000, date: "2026-05-15" },
  { id: 9105, order: 905, status: "Finished", amount: 700000, date: "2026-04-20" },
];

// amount is IRR (Toman * 10).
const txns = [
  { id: 9201, contract: 9101, type: "Gateway", status: "Success", amount: 19500000, date: "2026-05-05" },
  { id: 9202, contract: 9102, type: "Gateway", status: "Success", amount: 30000000, date: "2026-05-10" },
  { id: 9203, contract: 9102, type: "Return", status: "Success", amount: 5000000, date: "2026-05-18" },
  { id: 9204, contract: 9103, type: "Gateway", status: "Pending", amount: 17500000, date: "2026-05-12" },
  { id: 9205, contract: 9104, type: "Gateway", status: "Success", amount: 8000000, date: "2026-05-15" },
  { id: 9206, contract: 9104, type: "Return", status: "Success", amount: 8000000, date: "2026-05-16" },
  { id: 9207, contract: 9105, type: "Gateway", status: "Success", amount: 7000000, date: "2026-04-20" },
];

const ocLinks = contracts.map((c, i) => ({ id: 9301 + i, order_id: c.order, contract_id: c.id }));
const ctcLinks = txns.map((t, i) => ({ id: 9601 + i, contract_transaction_id: t.id, contract_id: t.contract }));
const oioLinks = orderItems.map((oi, i) => ({ id: 9401 + i, order_item_id: oi.id, order_id: oi.order }));
const oipvLinks = orderItems.map((oi, i) => ({ id: 9501 + i, order_item_id: oi.id, product_variation_id: oi.variation }));

// Hand-computed expected totals for 2026-05-01 .. 2026-05-31 (paid, net of refunds).
const EXPECTED = {
  window: "2026-05-01 .. 2026-05-31",
  grossToman: 5150000,
  units: 7,
  paidOrders: 2,
  discountsToman: 200000,
  refundsToman: 500000,
  netToman: 4450000,
  perVariation: {
    [V1]: { units: 3, gross: 2400000, discounts: 50000, refunds: 125000, net: 2225000 },
    [V3]: { units: 3, gross: 2400000, discounts: 150000, refunds: 375000, net: 1875000 },
    [V2]: { units: 1, gross: 350000, discounts: 0, refunds: 0, net: 350000 },
  },
  previousPeriodGrossToman: 700000, // order 905 (April)
};

function client() {
  return new Client({
    host: process.env.DATABASE_HOST || "127.0.0.1",
    port: Number(process.env.DATABASE_PORT) || 5432,
    database: process.env.DATABASE_NAME || "infinity_local",
    user: process.env.DATABASE_USERNAME || "infinity",
    password: process.env.DATABASE_PASSWORD || "infinity",
  });
}

async function teardown(c) {
  const orderIds = orders.map((o) => o.id);
  const itemIds = orderItems.map((o) => o.id);
  const contractIds = contracts.map((o) => o.id);
  const txnIds = txns.map((o) => o.id);
  await c.query(`DELETE FROM orders_contract_links WHERE order_id = ANY($1::int[])`, [orderIds]);
  await c.query(`DELETE FROM contract_transactions_contract_links WHERE contract_transaction_id = ANY($1::int[])`, [txnIds]);
  await c.query(`DELETE FROM order_items_order_links WHERE order_item_id = ANY($1::int[])`, [itemIds]);
  await c.query(`DELETE FROM order_items_product_variation_links WHERE order_item_id = ANY($1::int[])`, [itemIds]);
  await c.query(`DELETE FROM contract_transactions WHERE id = ANY($1::int[])`, [txnIds]);
  await c.query(`DELETE FROM order_items WHERE id = ANY($1::int[])`, [itemIds]);
  await c.query(`DELETE FROM contracts WHERE id = ANY($1::int[])`, [contractIds]);
  await c.query(`DELETE FROM orders WHERE id = ANY($1::int[])`, [orderIds]);
  // Belt-and-suspenders: anything still tagged.
  await c.query(`DELETE FROM contract_transactions WHERE external_source = $1`, [TAG]);
  await c.query(`DELETE FROM order_items WHERE external_source = $1`, [TAG]);
  await c.query(`DELETE FROM contracts WHERE external_source = $1`, [TAG]);
  await c.query(`DELETE FROM orders WHERE external_source = $1`, [TAG]);
}

async function seed(c) {
  for (const o of orders) {
    await c.query(
      `INSERT INTO orders (id, status, date, type, applied_discount_amount, payment_gateway, external_source, created_at, updated_at)
       VALUES ($1,$2,$3,'Automatic',$4,'Mellat',$5, now(), now())`,
      [o.id, o.status, o.date, o.discount, TAG],
    );
  }
  for (const oi of orderItems) {
    await c.query(
      `INSERT INTO order_items (id, count, per_amount, product_title, product_sku, external_source, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6, now(), now())`,
      [oi.id, oi.count, oi.per, oi.title, oi.sku, TAG],
    );
  }
  for (const ct of contracts) {
    await c.query(
      `INSERT INTO contracts (id, type, status, amount, tax_percent, date, external_source, created_at, updated_at)
       VALUES ($1,'Cash',$2,$3,10,$4,$5, now(), now())`,
      [ct.id, ct.status, ct.amount, ct.date, TAG],
    );
  }
  for (const t of txns) {
    await c.query(
      `INSERT INTO contract_transactions (id, type, amount, discount_amount, step, status, date, external_source, created_at, updated_at)
       VALUES ($1,$2,$3,0,1,$4,$5,$6, now(), now())`,
      [t.id, t.type, t.amount, t.status, t.date, TAG],
    );
  }
  for (const l of ocLinks)
    await c.query(`INSERT INTO orders_contract_links (id, order_id, contract_id) VALUES ($1,$2,$3)`, [l.id, l.order_id, l.contract_id]);
  for (const l of ctcLinks)
    await c.query(`INSERT INTO contract_transactions_contract_links (id, contract_transaction_id, contract_id) VALUES ($1,$2,$3)`, [l.id, l.contract_transaction_id, l.contract_id]);
  for (const l of oioLinks)
    await c.query(`INSERT INTO order_items_order_links (id, order_item_id, order_id) VALUES ($1,$2,$3)`, [l.id, l.order_item_id, l.order_id]);
  for (const l of oipvLinks)
    await c.query(`INSERT INTO order_items_product_variation_links (id, order_item_id, product_variation_id) VALUES ($1,$2,$3)`, [l.id, l.order_item_id, l.product_variation_id]);
}

async function main() {
  const teardownOnly = process.argv.includes("--teardown");
  const force = process.argv.includes("--force");
  const dbName = process.env.DATABASE_NAME || "infinity_local";
  if (!force && (process.env.NODE_ENV === "production" || /prod/i.test(dbName))) {
    console.error(`Refusing to run against "${dbName}" (looks like production). Use --force to override.`);
    process.exit(1);
  }

  const c = client();
  await c.connect();
  try {
    await c.query("BEGIN");
    await teardown(c);
    if (!teardownOnly) await seed(c);
    await c.query("COMMIT");
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    await c.end();
  }

  if (teardownOnly) {
    console.log("✓ Report fixtures removed.");
    return;
  }
  console.log("✓ Report fixtures seeded.");
  console.log("\nExpected totals (window " + EXPECTED.window + "):");
  console.log(JSON.stringify(EXPECTED, null, 2));
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { EXPECTED };
