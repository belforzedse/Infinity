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

## Docker

The `main.Dockerfile` automatically loads environment variables from `main.env`:

Build:

```bash
docker build -f main.Dockerfile -t infinity-frontend:prod .
```

Run:

```bash
docker run --rm -p 3000:3000 infinity-frontend:prod
```

No build args needed - environment variables are loaded automatically from `main.env`!

- fix(pdp): add `type="button"` to variation selector buttons (color/size/model)
- chore(a11y): add TODO to improve selected color state semantics for keyboard access

### Checkout Stability Improvements

- Stabilized deps in using primitives.
- Added merging and passed to for consistent totals.
- Preserved SnappPay eligibility on errors; removed silent catches.
- Removed localStorage fallback in finalize payload; rely on state.
- Typed cart query responses and added error-safe fallbacks.
