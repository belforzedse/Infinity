# Development Guide

This guide covers local development, environment, and project conventions for the Infinity Store frontend.

## Prerequisites

- Node.js 20+
- npm 10+ or Yarn (repo includes `yarn.lock` and `.yarnrc.yml`)

## Setup

1) Clone and install

```
git clone <repo-url>
cd infinity-frontend
npm install   # or: yarn install
```

2) Configure environment

```
cp .env.example .env
# Fill values to match your backend
```

3) Run in development

```
npm run dev   # serves on http://localhost:2888
```

## Environment Variables

Provided via `.env` (see `.env.example`). Key variables used in code:

- `NEXT_PUBLIC_API_BASE_URL`: Backend API base, e.g. `https://api.example.com/api`
- `NEXT_PUBLIC_IMAGE_BASE_URL`: Host for images/CDN, e.g. `https://api.example.com`
- `NEXT_PUBLIC_STRAPI_TOKEN`: Public token for Strapi‑exposed endpoints
- `NEXT_PUBLIC_ALLOWED_REDIRECT_ORIGINS`: Comma‑separated allow‑list of origins for external redirects on payment callback. If empty, dev allows any http(s).
- `NEXT_PUBLIC_ALLOWED_PAYMENT_ORIGINS`: Comma‑separated allow‑list for payment gateway redirects. If empty, dev allows any http(s).

Notes:

- `NEXT_PUBLIC_STRAPI_TOKEN` must be provided; the build will fail if it's missing.
- Treat tokens as secrets and avoid committing real credentials.

## NPM Scripts

- `dev`: Start Next dev server (port 2888)
- `build`: Production build
- `start`: Start production server (port 3000 by default)
- `test`: Run unit tests (Jest + Testing Library)
- `lint`: ESLint checks
- `format`: Prettier formatting

## Code Structure

- `src/app`: App Router routes (public, admin, super‑admin)
- `src/components`: UI components and kits
- `src/services`: Service layer for API calls (auth, product, cart, user, etc.)
- `src/constants`: Constants including API endpoints and config
- `src/hooks`: Custom hooks (data fetching, UI behavior)
- `src/types`: Shared types/interfaces
- `src/utils`: Utilities (API helpers, JWT, formatters)

## API Integration

- Central config in `src/constants/api.ts`
- Utilities in `src/utils/api.ts`
- Service modules under `src/services/**`
- Cart and checkout flows integrate with backend endpoints; see `docs/docs/cart-api-guide.md`

## Authentication

- OTP/password flows
- JWT stored client‑side; utility helpers in `src/utils/api.ts`
- Protected calls include auth headers in service layer

## Styling & UI

- Tailwind CSS with project presets (`tailwind.config.ts`)
- Component kits under `src/components/Kits/**`
- RTL‑first UI design; Peyda font + Inter for Latin

## Linting, Formatting, Tests

```
npm run lint
npm run format
npm test
```

Jest is configured via `jest.config.js` and `jest.setup.ts`. Next lint/TypeScript build tolerances are relaxed for iterative development (see `next.config.ts`).

## Docker

- `dev.Dockerfile` and `main.Dockerfile` expect environment variables to be provided at build time
  (e.g. with `--build-arg`).
- Exposes port 3000 for `npm start`

Example:

```
docker build -f dev.Dockerfile \
  --build-arg NEXT_PUBLIC_STRAPI_TOKEN=your_token \
  -t infinity-frontend:dev .
docker run --rm -p 3000:3000 \
  --env NEXT_PUBLIC_STRAPI_TOKEN=your_token \
  infinity-frontend:dev
```

To keep values in a file, pass `--env-file` to `docker run` instead of embedding them in the image.

## Conventions

- Keep components small and typed; prefer composition
- Add services/types before wiring UI to new endpoints
- Maintain RTL support and responsive behavior
- Use toast feedback for significant user actions

## Troubleshooting

- Port mismatches: dev runs on 2888; production/server runs on 3000
- Missing envs: check `.env` and that values are accessible with `NEXT_PUBLIC_*`
- Image domains: images are unoptimized; configure proper host/loader for production

