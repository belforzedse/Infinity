# APM (Application Performance Monitoring) Options

Optional guide for adding performance and error monitoring to the Infinity Store.

## Options

### Sentry (recommended for quick setup)

- **Frontend:** `@sentry/nextjs` – error tracking and performance (TTFB, LCP, etc.)
- **Backend:** `@sentry/node` – Strapi errors and slow transactions
- Free tier available; DSN configured via env vars.

### OpenTelemetry + Jaeger

- Self-hosted, no vendor lock-in.
- Instrument frontend (Next.js) and backend (Node) with OTel SDK; export traces to Jaeger.
- More setup (collector, Jaeger server, dashboards).

### Prometheus + Grafana

- Metrics only (no distributed tracing out of the box).
- Add `/metrics` endpoint to Strapi and Next.js (or use exporters); scrape with Prometheus; visualize in Grafana.

## When to add

- After infra and code optimizations, to measure impact.
- When you need production error alerting or performance baselines.

## References

- [Sentry Next.js SDK](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [OpenTelemetry JS](https://opentelemetry.io/docs/instrumentation/js/)
- [Strapi monitoring](https://docs.strapi.io/dev-docs/configurations/middlewares#logger) (built-in logger; APM is separate)
