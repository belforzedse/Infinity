# Social production deployment

The first Social release is production-only and serves `https://infinitygram.co`.

## What the repo deploys

- GitLab builds `infinity-social:main` from `apps/social/main.Dockerfile`.
- GitLab deploys four app containers into `/opt/infinity/social`.
- Host ports `2890-2893` map to the four Next.js containers.
- Social uses the public API/image hosts baked into the image:
  - `https://api.infinitycolor.co/api`
  - `https://api.infinitycolor.co`
- Social does not use a runtime env file and does not use the frontend internal Strapi URL pattern.

## Server setup

1. Point DNS for `infinitygram.co` to the target server.
2. Add the `social_upstream` block from `docs/nginx-upstream-snippet.conf`.
3. Create an Nginx `server` block for `infinitygram.co` that proxies `/` to `http://social_upstream`.
4. Issue TLS for `infinitygram.co`, then run `nginx -t` and reload Nginx.
5. Ensure the backend deployment containing the `https://infinitygram.co` CORS allowlist change is live before opening traffic.

## Verification

On the server:

```bash
cd /opt/infinity/social
docker compose -f docker-compose.yml -f docker-compose.ci.yml -f docker-compose.scale.yml -f docker-compose.scale.ci.yml ps
```

Expect exactly four healthy Social containers. Then verify:

- `https://infinitygram.co/`
- `https://infinitygram.co/robots.txt`
- `https://infinitygram.co/sitemap.xml`
- one public post route
- auth and profile flows
- image loading from `https://api.infinitycolor.co`

Do not add staging deployment, Social-specific runtime env files, or internal Strapi URLs until those are deliberately introduced later.
