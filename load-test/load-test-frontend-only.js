/**
 * Frontend-only load test (new.infinitycolor.co).
 * Use to see if the bottleneck is in front of the Next.js instances (e.g. Nginx/LB)
 * or to test Next.js capacity in isolation.
 *
 * Run: npx k6 run --vus 1000 --duration 2m load-test/load-test-frontend-only.js
 * Or ramp: npx k6 run load-test/load-test-frontend-only.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 200 },
    { duration: '30s', target: 500 },
    { duration: '30s', target: 1000 },
    { duration: '2m', target: 1000 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<10000', 'p(99)<30000'],
    http_req_failed: ['rate<0.50'],
  },
};

const FRONT = 'https://new.infinitycolor.co';
const REQ_TIMEOUT = '90s';

export default function () {
  const r = http.get(FRONT, { timeout: REQ_TIMEOUT });
  check(r, { 'frontend 200': (res) => res.status === 200 });
  sleep(0.5 + Math.random() * 1);
}
