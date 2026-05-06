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

---

## Why you see EOF, request timeout, connection reset by peer

When running with **high VUs** (e.g. 3000–7000), you may see:

| Error | Meaning |
|-------|--------|
| **EOF** | Connection closed before any response. Server or proxy closed the connection (often due to overload or limits). |
| **request timeout** | k6 did not get a full response within the default timeout (60s). Server is too slow under load. |
| **connection reset by peer** | Server (or Nginx/OS) actively closed the TCP connection. Typical when connection/worker limits are hit. |
| **broken pipe** | k6 tried to write on a connection the server had already closed. |

**Root cause:** With thousands of concurrent connections to a **single host** (e.g. `193.141.65.207` for both `new.infinitycolor.co` and `api.infinitycolor.co`), the stack is overloaded:

- **Nginx**: `worker_connections` and backlog limits.
- **Node/Strapi**: Event loop and memory under many concurrent requests.
- **OS**: File descriptor limits, TCP backlog, or out-of-memory killer.

So the server starts refusing new connections or closing existing ones, and k6 reports EOF / reset / timeout.

**What to do:**

1. **Lower concurrency** – Run with fewer VUs (e.g. 50–500) to find a level that stays within limits.
2. **Ramp up gradually** – Use `--stage` so the server isn’t hit with 7k VUs at once.
3. **Scale infrastructure** – More app/API instances behind a load balancer, higher Nginx/OS limits, or more powerful host.
4. **Increase k6 timeout** only if the server is slow but stable: `--http-debug=full` or set `timeout` in the script (e.g. `http.get(url, { timeout: '120s' })`). Prefer fixing server capacity first.

---

## Finding the bottleneck (e.g. failures at ~1k VUs)

If things break around **1k concurrent users** and you have multiple app instances (e.g. 12 Next.js), the limit is usually **one** of: the reverse proxy (Nginx), the load balancer, or a single backend (e.g. one Strapi). Isolate which one by loading only one target at a time.

### 1. Run frontend-only and API-only

From repo root:

```bash
# Frontend only (new.infinitycolor.co) – ramps to 1k and holds 2 min
npx k6 run load-test/load-test-frontend-only.js

# API only (api.infinitycolor.co) – same ramp
npx k6 run load-test/load-test-api-only.js
```

Or fixed 1k VUs for 2 minutes:

```bash
npx k6 run --vus 1000 --duration 2m load-test/load-test-frontend-only.js
npx k6 run --vus 1000 --duration 2m load-test/load-test-api-only.js
```

Compare the **http_req_failed** rate and errors in the output:

- **Frontend fails, API is fine** → Bottleneck is in front of Next.js (Nginx or LB in front of the 12 instances). With 12 instances, the single Nginx/LB is the likely limit (see below).
- **API fails, frontend is fine** → Bottleneck is Strapi or whatever sits in front of the API (Nginx/API gateway).
- **Both fail at similar VUs** → Shared layer (e.g. one Nginx handling both hostnames, or OS/network limits on the host).

### 2. If the frontend is the problem (12 Next.js, one Nginx)

Nginx has a hard limit: **worker_processes × worker_connections** (and often a smaller `worker_connections` per upstream). So for example:

- 1 worker × 512 connections → cap around **512** concurrent.
- 2 workers × 1024 → **2048** (but often limited by upstream or `multi_accept`/backlog).

On the server, check:

```bash
# Nginx: worker_processes and worker_connections
grep -E 'worker_processes|worker_connections' /etc/nginx/nginx.conf

# Live connection count (ESTABLISHED to your ports)
ss -s
netstat -an | grep -E ':443|:80' | grep ESTABLISHED | wc -l
```

Increase **worker_connections** (and optionally **worker_processes**) so that `worker_processes * worker_connections` is above the concurrency you need (e.g. 2000+ for 1k VUs, since each request holds a connection for a while). Then `nginx -t` and reload.

### 3. Optional: rule out the network

Run the same k6 script **from the server** (or a pod in the same DC) against **localhost** or the internal VIP. If failures disappear, the limit is before the app (e.g. Nginx accepting from the internet, or a cloud LB). If they stay, the limit is in Nginx upstream, Node, or the API.

---

## Production-style load test (testing real capacity)

To test whether the **cluster** can handle high concurrency (e.g. 4k users), two things matter:

1. **Cache handler on**  
   The Next.js custom cache handler (Redis + LRU in `apps/frontend/next.config.ts`) must be **enabled** in production. With it on, all Next instances share one cache; revalidation and Strapi load stay manageable. With it off, each instance has its own cache and you get revalidation storms and timeouts at lower VUs.

2. **Spread traffic across instances**  
   Nginx uses **ip_hash** for the Next upstream, so one client IP always hits the **same** backend instance. If you run k6 from **one machine** (one IP), almost all VUs hit **one** Next.js instance; the others stay idle. So you're stress-testing a single process, not the cluster.

   To test real capacity:

   - **Option A:** On the server, temporarily switch the Next upstream to **round_robin** (or **least_conn**) in the Nginx site config, reload Nginx, then run k6. Traffic will spread across all 12 instances. Restore **ip_hash** after the test if you want session/cache affinity again.
   - **Option B:** Run k6 from **multiple IPs** (e.g. distributed k6, or several runners) so ip_hash naturally distributes load.

With cache handler on and traffic spread (round-robin or multi-IP), you can see whether 12 Next + 6 Strapi actually handle 4k+ concurrent users. See [.cursor/rules/frontend-load-regression.mdc](../.cursor/rules/frontend-load-regression.mdc) for details.
