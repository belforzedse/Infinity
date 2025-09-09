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

- Framework: Next.js 15 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- State: Jotai
- Notifications: react-hot-toast
- Backend: Strapi v4 (via REST APIs)

Design: Figma — https://www.figma.com/design/x4y3qlCXNd3ZB6ocY09PPm/infinity-Store-(%D8%B5%D9%81%D8%AD%D9%87-%D8%B3%D8%A7%D8%B2)?node-id=6095-753

## Requirements

- Node.js 20+ (matches Docker images)
- npm 10+ or Yarn (repo includes `yarn.lock` and `.yarnrc.yml`)

## Quick Start

1) Clone and enter the project

```
git clone <repo-url>
cd infinity-frontend
```

2) Configure environment

```
cp .env.example .env
# Edit values to match your backend/hosts
```

3) Install dependencies

```
# with npm
npm install

# or with Yarn
yarn install
```

4) Run the dev server (port 2888)

```
npm run dev
# or
yarn dev
```

Open http://localhost:2888

## Environment Variables

Configure via `.env` (see `.env.example`). Notable variables:

- `NEXT_PUBLIC_API_BASE_URL`: Base URL for backend API, e.g. `https://api.example.com/api`
- `NEXT_PUBLIC_IMAGE_BASE_URL`: Base host for media/CDN, e.g. `https://api.example.com`
- `NEXT_PUBLIC_STRAPI_TOKEN`: Public token for Strapi‑accessible endpoints (avoid committing secrets)
- `NEXT_PUBLIC_ALLOWED_REDIRECT_ORIGINS`: Comma‑separated allow‑list of origins permitted for redirects from payment callbacks; if empty, all http(s) allowed in dev
- `NEXT_PUBLIC_ALLOWED_PAYMENT_ORIGINS`: Comma‑separated allow‑list for payment gateway redirect origins; if empty, all http(s) allowed in dev

Note: Some defaults exist in code for local/dev parity; provide explicit values for production.

## Scripts

- `dev`: Start Next dev server on port 2888
- `build`: Production build
- `start`: Start production server (defaults to port 3000)
- `lint`: Run ESLint
- `format`: Run Prettier formatting
- `test`: Run Jest tests

## Docker

Two Dockerfiles are provided:

- `dev.Dockerfile`: development build (copies `dev.env` to `.env` in image)
- `main.Dockerfile`: production build (copies `main.env` to `.env` in image)

Build and run (dev):

```
docker build -f dev.Dockerfile -t infinity-frontend:dev .
docker run --rm -p 3000:3000 infinity-frontend:dev
```

Build and run (prod):

```
docker build -f main.Dockerfile -t infinity-frontend:prod .
docker run --rm -p 3000:3000 infinity-frontend:prod
```

Alternatively, pass your own envs at runtime with `--env-file` and adjust the Dockerfiles to not copy the bundled `*.env`.

## Tests, Lint, Format

```
npm test
npm run lint
npm run format
```

## Project Structure (selected)

- `src/app`: Next.js App Router routes (public, admin, super‑admin)
- `src/components`: UI components and kits (auth, PLP/PDP, cart, etc.)
- `src/services`: API service layer (auth, product, cart, user, etc.)
- `src/constants`: API endpoints, config constants
- `src/hooks`: Custom React hooks
- `src/types`: Shared TypeScript types/interfaces
- `src/utils`: Helpers (API utils, auth, formatting)
- `public`: Static assets
- `docs`: Additional documentation

## Additional Docs

- Developer guide: `DEVELOPMENT.md`
- Cart API guide: `docs/docs/cart-api-guide.md`
- Postman collection: `docs/docs/cart-api-postman-collection.json`
- Docs index: `docs/README.md`

## Notes

- Strict mode is disabled in dev to match existing behavior (`next.config.ts`)
- Images are unoptimized in config; configure a loader/host for production

## License

No license file is included in this repository. All rights reserved unless otherwise specified.

