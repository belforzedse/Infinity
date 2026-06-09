#!/usr/bin/env node

const { spawnSync } = require("node:child_process");

const container = process.env.POSTGRES_CONTAINER || "infinity-postgres-local";
const user = process.env.POSTGRES_USER || "infinity";
const database = process.env.POSTGRES_DB || "infinity_local";

const sql = String.raw`
\timing on

\echo '== Existing product-related indexes =='
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(to_regclass(format('%I.%I', schemaname, indexname)))) AS index_size,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    tablename IN (
      'products',
      'product_variations',
      'product_stocks',
      'products_product_main_category_links',
      'product_variations_product_links',
      'product_variations_product_stock_links'
    )
    OR tablename LIKE 'product_%'
  )
ORDER BY tablename, indexname;

\echo '== Table sizes =='
SELECT
  relname AS table_name,
  pg_size_pretty(pg_total_relation_size(oid)) AS total_size,
  pg_size_pretty(pg_relation_size(oid)) AS table_size
FROM pg_class
WHERE relkind = 'r'
  AND relname IN (
    'products',
    'product_variations',
    'product_stocks',
    'products_product_main_category_links',
    'product_variations_product_links',
    'product_variations_product_stock_links'
  )
ORDER BY relname;

\echo '== Homepage batch query: current newest/discounted/favorites source =='
EXPLAIN (ANALYZE, BUFFERS)
SELECT p.id
FROM products AS p
WHERE p.removed_at IS NULL
  AND p.status = 'Active'
  AND EXISTS (
    SELECT 1
    FROM product_variations AS pv
    INNER JOIN product_variations_product_links AS pv_product_link
      ON pv_product_link.product_variation_id = pv.id
    INNER JOIN product_variations_product_stock_links AS pv_stock_link
      ON pv_stock_link.product_variation_id = pv.id
    INNER JOIN product_stocks AS ps
      ON ps.id = pv_stock_link.product_stock_id
    WHERE pv_product_link.product_id = p.id
      AND pv.price >= 1
      AND ps.count > 0
  )
ORDER BY
  EXISTS (
    SELECT 1
    FROM product_variations AS pv
    INNER JOIN product_variations_product_links AS pv_product_link
      ON pv_product_link.product_variation_id = pv.id
    INNER JOIN product_variations_product_stock_links AS pv_stock_link
      ON pv_stock_link.product_variation_id = pv.id
    INNER JOIN product_stocks AS ps
      ON ps.id = pv_stock_link.product_stock_id
    WHERE pv_product_link.product_id = p.id
      AND pv.is_published = true
      AND pv.price > 0
      AND ps.count > 0
  ) DESC,
  p.created_at DESC,
  p.id ASC
LIMIT 36;

\echo '== Homepage title keyword query: newest fallback =='
EXPLAIN (ANALYZE, BUFFERS)
SELECT p.id
FROM products AS p
WHERE p.removed_at IS NULL
  AND p.status = 'Active'
  AND p.title ILIKE '%G%'
  AND EXISTS (
    SELECT 1
    FROM product_variations AS pv
    INNER JOIN product_variations_product_links AS pv_product_link
      ON pv_product_link.product_variation_id = pv.id
    INNER JOIN product_variations_product_stock_links AS pv_stock_link
      ON pv_stock_link.product_variation_id = pv.id
    INNER JOIN product_stocks AS ps
      ON ps.id = pv_stock_link.product_stock_id
    WHERE pv_product_link.product_id = p.id
      AND pv.price >= 1
      AND ps.count > 0
  )
ORDER BY
  EXISTS (
    SELECT 1
    FROM product_variations AS pv
    INNER JOIN product_variations_product_links AS pv_product_link
      ON pv_product_link.product_variation_id = pv.id
    INNER JOIN product_variations_product_stock_links AS pv_stock_link
      ON pv_stock_link.product_variation_id = pv.id
    INNER JOIN product_stocks AS ps
      ON ps.id = pv_stock_link.product_stock_id
    WHERE pv_product_link.product_id = p.id
      AND pv.is_published = true
      AND pv.price > 0
      AND ps.count > 0
  ) DESC,
  p.created_at DESC,
  p.id ASC
LIMIT 20;

\echo '== Homepage category assignment query: replace slug before using for a production-like plan =='
EXPLAIN (ANALYZE, BUFFERS)
SELECT p.id
FROM products AS p
WHERE p.removed_at IS NULL
  AND p.status = 'Active'
  AND EXISTS (
    SELECT 1
    FROM products_product_main_category_links AS pc_link
    INNER JOIN product_categories AS pc
      ON pc.id = pc_link.product_category_id
    WHERE pc_link.product_id = p.id
      AND pc.slug = current_setting('homepage.category_slug', true)
  )
  AND EXISTS (
    SELECT 1
    FROM product_variations AS pv
    INNER JOIN product_variations_product_links AS pv_product_link
      ON pv_product_link.product_variation_id = pv.id
    INNER JOIN product_variations_product_stock_links AS pv_stock_link
      ON pv_stock_link.product_variation_id = pv.id
    INNER JOIN product_stocks AS ps
      ON ps.id = pv_stock_link.product_stock_id
    WHERE pv_product_link.product_id = p.id
      AND pv.price >= 1
      AND ps.count > 0
  )
ORDER BY
  EXISTS (
    SELECT 1
    FROM product_variations AS pv
    INNER JOIN product_variations_product_links AS pv_product_link
      ON pv_product_link.product_variation_id = pv.id
    INNER JOIN product_variations_product_stock_links AS pv_stock_link
      ON pv_stock_link.product_variation_id = pv.id
    INNER JOIN product_stocks AS ps
      ON ps.id = pv_stock_link.product_stock_id
    WHERE pv_product_link.product_id = p.id
      AND pv.is_published = true
      AND pv.price > 0
      AND ps.count > 0
  ) DESC,
  p.created_at DESC,
  p.id ASC
LIMIT 20;
`;

const result = spawnSync(
  "docker",
  ["exec", "-i", container, "psql", "-U", user, "-d", database, "-v", "ON_ERROR_STOP=1"],
  {
    input: sql,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 20,
  },
);

if (result.error) {
  console.error(`[homepage-query-plans] Failed to run docker: ${result.error.message}`);
  process.exit(1);
}

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

if (result.status !== 0) {
  console.error(`[homepage-query-plans] psql exited with ${result.status}`);
  process.exit(result.status || 1);
}

console.log("\n== Index decision record ==");
console.log("No index migration is generated by this diagnostic script.");
console.log("Add an index only after comparing before/after EXPLAIN (ANALYZE, BUFFERS), index size, and write cost.");
console.log("Rollback SQL is therefore pending until an accepted index exists.");
