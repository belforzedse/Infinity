# Load testing (k6)

Single-IP runs stay under Nginx rate limits so you don’t get 429s.

**Copy to server (from repo root on your machine):**

```bash
scp -r load-test user@your-server:/path/to/Infinitycolor/
```

Then on the server: `cd /path/to/Infinitycolor && k6 run --vus 7000 --duration 5m load-test/load-test.js` (install k6 on the server if needed).

**Run (from repo root):**

```bash
npx k6 run load-test/load-test.js
```

Or install k6 then: `k6 run load-test/load-test.js`

**Heavier run (may hit rate limit from one IP):**

```bash
npx k6 run load-test/stress-test.js
```

**Custom VUs and duration (CLI overrides script stages):**

Example – 7k users for 5 minutes:

```bash
npx k6 run --vus 7000 --duration 5m load-test/load-test.js
```

**Ramp up (avoid slamming frontend):** use `--stage duration:target`. Each stage is optional; later stages override the script’s stages.

Example – ramp to 7k over ~4m, hold 5m, ramp down 1m:

```bash
k6 run --stage 30s:0 --stage 1m:500 --stage 1m:2000 --stage 1m:5000 --stage 1m:7000 --stage 5m:7000 --stage 1m:0 load-test/load-test.js
```

On server with Docker (host network):

```bash
docker run --rm --network host -v /etc/load-test:/scripts grafana/k6 run --stage 30s:0 --stage 1m:500 --stage 1m:2000 --stage 1m:5000 --stage 1m:7000 --stage 5m:7000 --stage 1m:0 /scripts/load-test.js
```

**Note:** 7k concurrent users from one IP will likely hit Nginx rate limits (429). To avoid 429s: on the server, temporarily comment out the `limit_req` lines in the Nginx site config for the test, then restore after.
