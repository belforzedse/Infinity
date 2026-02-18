/**
 * Heavier k6 run – may hit Nginx rate limit (429) from one IP.
 * Use after verifying normal load-test.js passes.
 *
 * To avoid 429s from a single IP, either:
 * - Temporarily raise/disable Nginx limit_req for your IP on the server, or
 * - Run with fewer VUs (e.g. change 60 -> 30 in stages).
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 40 },
    { duration: '2m', target: 40 },
    { duration: '1m', target: 60 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000', 'p(99)<6000'],
    http_req_failed: ['rate<0.10'],
  },
};

const FRONT = 'https://new.infinitycolor.co';
const API = 'https://api.infinitycolor.co';

export default function () {
  const r1 = http.get(FRONT);
  check(r1, { 'frontend ok': (r) => r.status === 200 || r.status === 429 });

  sleep(0.3 + Math.random() * 0.7);

  const r2 = http.get(`${API}/api/products?pagination[page]=1&pagination[pageSize]=12`);
  check(r2, { 'api ok': (r) => r.status === 200 || r.status === 429 });

  sleep(0.8 + Math.random() * 1.5);
}
