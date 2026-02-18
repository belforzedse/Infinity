# Load testing (k6)

Single-IP runs stay under Nginx rate limits so you don’t get 429s.

**Run (from repo root):**

```bash
npx k6 run load-test/load-test.js
```

Or install k6 then: `k6 run load-test/load-test.js`

**Heavier run (may hit rate limit from one IP):**

```bash
npx k6 run load-test/stress-test.js
```

To stress-test without 429s: on the server, temporarily comment out the `limit_req` lines in the Nginx site config for the test, then restore after.
