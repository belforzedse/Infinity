# Social app

`@repo/social` is the public Social experience for Infinity Color. Local development runs on port `2890`.

## Local development

From the repository root:

```bash
pnpm --filter @repo/social dev
```

Open `http://localhost:2890`.

The app reads the shared public API defaults from `@repo/api`:

- API: `https://api.infinitycolor.co/api` in production
- images: `https://api.infinitycolor.co` in production

`NEXT_PUBLIC_SOCIAL_HOME_POSTS_DEMO=true` is only for local/demo work. Do not enable it for the public deployment.

## Production deployment

Production is deployed only from the `main` branch through `.gitlab-ci.yml`.

- image: `infinity-social`
- host directory: `/opt/infinity/social`
- containers: `infinity-social`, `infinity-social-2`, `infinity-social-3`, `infinity-social-4`
- host ports: `2890-2893`
- public site URL: `https://infinitygram.co`

The production image bakes these public values into the build:

- `NEXT_PUBLIC_API_BASE_URL=https://api.infinitycolor.co/api`
- `NEXT_PUBLIC_IMAGE_BASE_URL=https://api.infinitycolor.co`
- `NEXT_PUBLIC_SITE_URL=https://infinitygram.co`

There is intentionally no Social runtime env file yet. The Social containers call Strapi through the public API URLs; do not add `STRAPI_INTERNAL_URL` or `STRAPI_BUILD_TIME_URL` for this app.

## Nginx

Use the `social_upstream` block from `docs/nginx-upstream-snippet.conf` in the `infinitygram.co` server config and proxy the site to that upstream:

```nginx
location / {
    proxy_pass http://social_upstream;
}
```

Keep Social proxying separate from storefront traffic. Only the Social Next.js containers belong in `social_upstream`.

## Verification

After deploy:

```bash
cd /opt/infinity/social
docker compose -f docker-compose.yml -f docker-compose.ci.yml -f docker-compose.scale.yml -f docker-compose.scale.ci.yml ps
```

Confirm all four Social containers are healthy, then smoke test:

- `/`
- `/auth`
- `/search`
- a public `/post/<slug>`
- `/robots.txt`
- `/sitemap.xml`
