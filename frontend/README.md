# Infinity Store — Next.js E‑commerce Frontend

Modern, RTL‑first e‑commerce frontend built with Next.js (App Router), TypeScript, Tailwind CSS, and Jotai. Integrates with a Strapi v4 backend and includes a robust auth flow, product catalog, cart/checkout, and admin areas.

## Highlights

- Authentication with OTP/password, JWT handling, and responsive RTL UI
- Product catalog with variations, filters (PLP), and media gallery (PDP)
- Shopping cart with drawer UI, local persistence, and checkout flow
- Super‑admin and admin sections for content/product management
- API services layer with typed endpoints and helper utilities
- Tailwind + component kits; toast notifications; loading/progress UX

## Tech Stack

- Framework: Next.js 16.0.3 (App Router)
- React: 19.2.0
- Language: TypeScript 5 (strict mode)
- Styling: Tailwind CSS 3.4.1
- State: Jotai 2.11.1
- Forms: React Hook Form 7.54.2
- Notifications: react-hot-toast
- Backend: Strapi v4.25.21 (via REST APIs)

the design: Figma — https://www.figma.com/design/x4y3qlCXNd3ZB6ocY09PPm/infinity-Store-(%D8%B5%D9%81%D8%AD%D9%87-%D8%B3%D8%A7%D8%B2)?node-id=6095-753

## Requirements

- Node.js 20+ (matches Docker images)
- npm 10+ or Yarn (repo includes `yarn.lock` and `.yarnrc.yml`)

## Quick Start

1. Clone and enter the project

```bash
git clone <repo-url>
cd infinity-frontend
```

2. Install dependencies

```bash
npm install --legacy-peer-deps
```

3. Run the dev server (port 2888)

```bash
npm run dev
```

Open http://localhost:2888

Environment variables are automatically loaded from `dev.env` - no manual configuration needed!

## Environment Variables

Environment variables are automatically loaded by `load-env.js`:

- **`dev.env`** - Development environment (auto-loaded in dev mode)
- **`main.env`** - Production environment (auto-loaded when `NODE_ENV=production`)
- **`.env.local`** - Personal overrides (optional, gitignored)

Key variables:

- `NEXT_PUBLIC_API_BASE_URL`: Base URL for backend API
- `NEXT_PUBLIC_IMAGE_BASE_URL`: Base host for media/CDN
- `NEXT_PUBLIC_STRAPI_TOKEN`: Public token for Strapi endpoints

To override locally, create `.env.local`:

```bash
# .env.local (gitignored)
NEXT_PUBLIC_API_BASE_URL=http://localhost:1337/api
NEXT_PUBLIC_IMAGE_BASE_URL=http://localhost:1337/
```

## Scripts

- `dev`: Start Next dev server on port 2888
- `build`: Production build
- `start`: Start production server (defaults to port 3000)
- `lint`: Run ESLint
- `format`: Run Prettier formatting
- `test`: Run Jest tests

## Docker & Compose

Both Dockerfiles now rely on build arguments rather than reading `main.env`/`dev.env` during the image build. Pass the public Strapi values explicitly (or export them in your shell) before building:

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.example.com/api \
  --build-arg NEXT_PUBLIC_IMAGE_BASE_URL=https://api.example.com \
  --build-arg NEXT_PUBLIC_STRAPI_TOKEN=token \
  -f main.Dockerfile \
  -t infinity-frontend:prod .

docker run --rm -p 3000:3000 infinity-frontend:prod
```

For repeatable local runs the repo ships with `docker-compose.yml`. Create a `.env` file (ignored by git) with the three `NEXT_PUBLIC_*` values plus any overrides such as `HOST_PORT`, then:

```bash
docker compose up --build
```

Compose will forward the env values as both build args and runtime vars so the container behaves the same way you’ll deploy it in CI/CD.

## CI/CD & Deployment

- GitHub Actions workflow: `.github/workflows/frontend-cicd.yml`
  - Triggers on pushes to `main`, `dev`, `experimental`, plus manual dispatch.
  - Steps: `npm ci` → resolve branch-specific `NEXT_PUBLIC_*` envs → `npm run build` → Docker build with `--build-arg NEXT_PUBLIC_*` → push to `ghcr.io/belforzedse/infinity-frontend:<sha>` and `<branch>` tags.
- Deployment targets and Compose env files:

| Branch | VM (SSH) | Image tag | Env file on server |
| --- | --- | --- | --- |
| `main` | `deploy@193.141.65.207:3031` | `ghcr.io/belforzedse/infinity-frontend:main` | `/opt/infinity/frontend/main.env` |
| `dev` | `deploy@193.141.65.208:3031` | `…:dev` | `/opt/infinity/frontend/dev.env` |
| `experimental` | `deploy@193.141.65.212:3031` | `…:experimental` | `/opt/infinity/frontend/main.env` |

- Deployment flow per branch:
  1. SCP `frontend/docker-compose.yml` to `/opt/infinity/frontend/`.
  2. SSH in with the `deploy` user (key stored as `*_FRONTEND_SSH_KEY` secret).
  3. Rewrite the env file with the GitHub secrets and run `docker compose pull && docker compose up -d --remove-orphans`, then prune dangling images.
- Required repository secrets (per environment prefix `PROD_`, `STAGING_`, `EXPERIMENTAL_`): `*_FRONTEND_HOST`, `*_FRONTEND_PORT`, `*_FRONTEND_USER`, `*_FRONTEND_SSH_KEY`, `*_FRONTEND_API_BASE_URL`, `*_FRONTEND_IMAGE_BASE_URL`, `*_FRONTEND_STRAPI_TOKEN`.
- Shared registry secrets: `GHCR_DEPLOY_USER` (GitHub username used for pulls) and `GHCR_DEPLOY_TOKEN` (PAT with `read:packages`) so the VMs can `docker login ghcr.io` before pulling.
- Each VM must have Docker Engine + Compose v2 installed, `deploy` added to the `docker` group, and `/opt/infinity/frontend` owned by `deploy`.***

- fix(pdp): add `type="button"` to variation selector buttons (color/size/model)
- chore(a11y): add TODO to improve selected color state semantics for keyboard access

### Checkout Stability Improvements

- Stabilized deps in using primitives.
- Added merging and passed to for consistent totals.
- Preserved SnappPay eligibility on errors; removed silent catches.
- Removed localStorage fallback in finalize payload; rely on state.
- Typed cart query responses and added error-safe fallbacks.
