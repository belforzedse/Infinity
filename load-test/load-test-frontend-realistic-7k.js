/**
 * Realistic load: ~7000 user *sessions* over 10 minutes (not 7000 concurrent
 * homepage hammering). Each session browses several pages with long think time.
 *
 * Why this differs from load-test-frontend-7k-10m.js:
 * - Old script: 7000 VUs = 7000 concurrent workers, many stuck on slow SSR → timeouts
 * - This script: ~12 new sessions/sec at peak ≈ 7200 sessions in 10 min, lower concurrency
 *
 * Prerequisites: Nginx least_conn for test window; 172.17.0.1:8080 internal API.
 *
 * Run:
 *   k6 run load-test/load-test-frontend-realistic-7k.js
 *
 * Tune targets (optional):
 *   k6 run -e TARGET_SESSIONS=7000 -e HOLD_MINUTES=10 load-test/...
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const FRONT = 'https://new.infinitycolor.co';
const API = 'https://api.infinitycolor.co/api';
const REQ_TIMEOUT = '90s';

const targetSessions = Number(__ENV.TARGET_SESSIONS || 7000);
const holdMinutes = Number(__ENV.HOLD_MINUTES || 10);
const holdSeconds = holdMinutes * 60;
/** New sessions per second at peak (≈ sessions in hold window) */
const peakRate = Math.max(1, Math.ceil(targetSessions / holdSeconds));

export const options = {
  scenarios: {
    realistic_shoppers: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: 800,
      maxVUs: 2500,
      stages: [
        { duration: '30s', target: Math.max(1, Math.floor(peakRate * 0.25)) },
        { duration: '30s', target: Math.max(1, Math.floor(peakRate * 0.5)) },
        { duration: '30s', target: peakRate },
        { duration: `${holdMinutes}m`, target: peakRate },
        { duration: '2m', target: 0 },
      ],
      gracefulStop: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.15'],
    http_req_duration: ['p(95)<60000'],
  },
};

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function get(path, name) {
  const res = http.get(path, {
    timeout: REQ_TIMEOUT,
    tags: { name },
  });
  check(res, {
    [`${name} status 2xx`]: (r) => r.status >= 200 && r.status < 400,
  });
  return res;
}

/** One virtual shopper: mixed storefront + occasional API (like client fetches). */
export default function shopperSession() {
  // Land on home (most common entry)
  get(FRONT, 'home');
  sleep(randomBetween(10, 25));

  const roll = Math.random();

  if (roll < 0.75) {
    get(`${FRONT}/plp`, 'plp');
    sleep(randomBetween(15, 45));
  }

  if (roll < 0.45) {
    get(`${FRONT}/categories`, 'categories');
    sleep(randomBetween(12, 35));
  }

  if (roll < 0.2) {
    get(`${FRONT}/blog`, 'blog');
    sleep(randomBetween(10, 30));
  }

  // Client-side style product list (lighter than full SSR home)
  if (Math.random() < 0.35) {
    get(
      `${API}/products?pagination[page]=1&pagination[pageSize]=12&filters[Status][$eq]=Active`,
      'api_products',
    );
    sleep(randomBetween(8, 20));
  }

  // Second page view before leaving
  if (Math.random() < 0.5) {
    get(`${FRONT}/plp`, 'plp_return');
    sleep(randomBetween(10, 30));
  }
}
