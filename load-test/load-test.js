/**
 * k6 load test for Infinity Store (new.infinitycolor.co + api.infinitycolor.co).
 *
 * Run from your machine:  npx k6 run load-test/load-test.js
 * Or install k6:          npm install -g k6  (or scoop/choco install k6)
 *
 * Rate limit note: Nginx limits one IP (e.g. 50 r/s frontend, 30 r/s API).
 * This script keeps total request rate under those limits so you don't get 429s.
 * For a full stress test, temporarily relax Nginx rate limits on the server or
 * run from multiple IPs (e.g. CI from multiple runners).
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 15 },
    { duration: '1m', target: 25 },
    { duration: '1m', target: 25 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<4000'],
    http_req_failed: ['rate<0.05'],
  },
};

const FRONT = 'https://new.infinitycolor.co';
const API = 'https://api.infinitycolor.co';

export default function () {
  const r1 = http.get(FRONT);
  check(r1, { 'frontend 200': (r) => r.status === 200 });

  sleep(0.5 + Math.random() * 1);

  const r2 = http.get(`${API}/api/products?pagination[page]=1&pagination[pageSize]=12`);
  check(r2, { 'api 200': (r) => r.status === 200 });

  sleep(1 + Math.random() * 2);
}
