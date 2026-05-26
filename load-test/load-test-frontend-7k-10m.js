/**
 * Ramp to 7000 VUs, hold 10 minutes, ramp down.
 * Full homepage (heavy SSR). Monitor the live site in a browser while this runs.
 *
 * Prerequisites on production:
 * - Nginx next_upstream + strapi_upstream: least_conn (not ip_hash) for the test window
 * - listen 172.17.0.1:8080 for internal API (homepage products)
 * - limit_req commented out or raised
 *
 * Run:
 *   k6 run load-test/load-test-frontend-7k-10m.js
 *
 * Shorter ramp (more errors likely):
 *   k6 run -e RAMP_PROFILE=fast load-test/load-test-frontend-7k-10m.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const FRONT = 'https://new.infinitycolor.co';
const REQ_TIMEOUT = '120s';

/** ~9 min ramp, 10 min hold at 7k, ~2 min ramp down (~21 min total) */
/** @type {import('k6/options').Stage[]} */
const defaultStages = [
  { duration: '30s', target: 200 },
  { duration: '1m', target: 1000 },
  { duration: '2m', target: 2500 },
  { duration: '2m', target: 4000 },
  { duration: '2m', target: 5500 },
  { duration: '2m', target: 7000 },
  { duration: '10m', target: 7000 },
  { duration: '2m', target: 0 },
];

/** ~5 min ramp, 10 min hold */
/** @type {import('k6/options').Stage[]} */
const fastStages = [
  { duration: '10s', target: 500 },
  { duration: '10s', target: 2000 },
  { duration: '10s', target: 4500 },
  { duration: '1m', target: 7000 },
  { duration: '10m', target: 7000 },
  { duration: '2m', target: 0 },
];

const rampProfile = `${__ENV.RAMP_PROFILE || 'default'}`.toLowerCase();
const stages = rampProfile === 'fast' ? fastStages : defaultStages;

export const options = {
  stages,
  gracefulRampDown: '2m',
  gracefulStop: '30s',
  thresholds: {
    http_req_failed: ['rate<0.50'],
    http_req_duration: ['p(95)<120000'],
  },
};

export default function () {
  const res = http.get(FRONT, {
    timeout: REQ_TIMEOUT,
    tags: { name: 'homepage' },
  });
  check(res, {
    'homepage status 200': (r) => r.status === 200,
  });
  sleep(8 + Math.random() * 7);
}
