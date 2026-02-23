/**
 * API-only load test (api.infinitycolor.co).
 * Use to see if the bottleneck is Strapi/API or in front of it (e.g. Nginx/LB).
 *
 * Run: npx k6 run --vus 1000 --duration 2m load-test/load-test-api-only.js
 * Or ramp: npx k6 run load-test/load-test-api-only.js
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

const API = 'https://api.infinitycolor.co';
const REQ_TIMEOUT = '90s';

export default function () {
  const r = http.get(`${API}/api/products?pagination[page]=1&pagination[pageSize]=12`, {
    timeout: REQ_TIMEOUT,
  });
  check(r, { 'api 200': (res) => res.status === 200 });
  sleep(0.5 + Math.random() * 1);
}
