/**
 * Gentle ramp to 7000 concurrent VUs on the storefront homepage.
 *
 * Compared to load-test-frontend-only.js:
 * - Default ~14 min ramp to 7k (not ~30 min)
 * - 8–15 s think time between requests (lower RPS per VU)
 * - 120 s request timeout
 *
 * Prerequisites (production):
 * - Nginx next_upstream on least_conn (not ip_hash) for the test window
 * - limit_req/limit_conn commented out or raised
 *
 * Run (k6 CLI installed — not npx):
 *   k6 run load-test/load-test-frontend-7k-gentle.js
 *
 * Slower ramp (~29 min to 7k):
 *   k6 run -e RAMP_PROFILE=slow load-test/load-test-frontend-7k-gentle.js
 *
 * Aggressive ramp (~8 min to 7k — more errors likely):
 *   k6 run -e RAMP_PROFILE=fast load-test/load-test-frontend-7k-gentle.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const FRONT = 'https://new.infinitycolor.co';
const REQ_TIMEOUT = '120s';

/** Default: ~14 min to 7k, 5 min hold, ~3 min ramp down */
/** @type {import('k6/options').Stage[]} */
const defaultStages = [
  { duration: '30s', target: 200 },
  { duration: '1m', target: 800 },
  { duration: '2m', target: 2000 },
  { duration: '3m', target: 4000 },
  { duration: '4m', target: 6000 },
  { duration: '3m', target: 7000 },
  { duration: '5m', target: 7000 },
  { duration: '3m', target: 0 },
];

/** @type {import('k6/options').Stage[]} */
const slowStages = [
  { duration: '1m', target: 100 },
  { duration: '2m', target: 300 },
  { duration: '3m', target: 700 },
  { duration: '4m', target: 1500 },
  { duration: '5m', target: 3000 },
  { duration: '6m', target: 5000 },
  { duration: '8m', target: 7000 },
  { duration: '5m', target: 7000 },
  { duration: '5m', target: 0 },
];

/** @type {import('k6/options').Stage[]} */
const fastStages = [
  { duration: '30s', target: 500 },
  { duration: '1m', target: 2000 },
  { duration: '2m', target: 4500 },
  { duration: '2m', target: 7000 },
  { duration: '3m', target: 7000 },
  { duration: '2m', target: 0 },
];

const rampProfile = `${__ENV.RAMP_PROFILE || 'default'}`.toLowerCase();
const stages =
  rampProfile === 'slow' ? slowStages : rampProfile === 'fast' ? fastStages : defaultStages;

export const options = {
  stages,
  gracefulRampDown: '2m',
  gracefulStop: '30s',
  // Loose thresholds — run completes even under stress; read summary for real health
  thresholds: {
    http_req_failed: ['rate<0.25'],
    http_req_duration: ['p(95)<120000'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

export default function () {
  const res = http.get(FRONT, {
    timeout: REQ_TIMEOUT,
    tags: { name: 'homepage' },
  });
  check(res, {
    'homepage status 200': (r) => r.status === 200,
  });
  // Think time: simulates users reading the page, keeps RPS lower than the 1k-VU script
  sleep(8 + Math.random() * 7);
}
