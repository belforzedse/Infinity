# Infinitycolor E2E

Playwright E2E smoke tests for real storefront and low-risk admin flows. Phase 1/1.5 targets a local isolated backend/frontend stack and does not touch GitLab CI.

## What Phase 1/1.5 Covers

- Backend health and seeded product API contract.
- Homepage sections rendering a real seeded product card.
- Category PLP to PDP navigation.
- PDP variation state, including a hexless color option and an unavailable option.
- Desktop quick view opening from a product card and linking to the full PDP.
- Mobile small-card quick view opening from the small-card action menu.
- Guest cart add/update/reload/remove behavior.
- Guest checkout redirecting to auth with the checkout return path.
- Authenticated checkout validation before any order/payment submission.
- Desktop super-admin product category create/edit/delete smoke.

## Local Prerequisites

- Node 20 is recommended because the backend declares `>=18 <=20`.
- Backend available at `http://127.0.0.1:1337` with a local/test database.
- Frontend available at `http://localhost:2888`.
- The database name should include `local`, `test`, or `e2e`, or the seed script will refuse to run.

Useful local defaults:

```powershell
$env:E2E_BASE_URL = "http://localhost:2888"
$env:E2E_API_URL = "http://127.0.0.1:1337/api"
$env:NEXT_PUBLIC_API_BASE_URL = "http://127.0.0.1:1337/api"
$env:NEXT_PUBLIC_IMAGE_BASE_URL = "http://127.0.0.1:1337"
$env:STRAPI_INTERNAL_URL = "http://127.0.0.1:1337/api"
$env:E2E_CUSTOMER_PHONE = "+989000000101"
$env:E2E_CUSTOMER_PASSWORD = "E2eCustomer!123"
$env:E2E_ADMIN_PHONE = "+989000000201"
$env:E2E_ADMIN_PASSWORD = "E2eAdmin!123"
```

Use `localhost` for the frontend in local Next dev. Next 16 blocks dev/HMR resources
when the browser origin is `127.0.0.1` unless `allowedDevOrigins` is configured.

For the cleanest local signal, run the backend with endpoint response cache disabled:

```powershell
$env:ENABLE_ENDPOINT_RESPONSE_CACHE = "false"
```

## Running

Install the Playwright browser once:

```powershell
pnpm --filter @repo/e2e install:browsers
```

Run the smoke suite:

```powershell
pnpm e2e:smoke
```

By default, global setup waits for `/_health` and runs:

```powershell
pnpm --filter @repo/backend seed:e2e
```

The seed command creates deterministic storefront fixtures plus local-only E2E customer/admin users. It also gives the E2E customer a seeded cart with the smoke product so authenticated checkout validation does not depend on an extra add-to-cart step. Playwright uses the seeded user ids and local `JWT_SECRET` to generate storage state under `apps/e2e/.auth/`, avoiding login rate-limit flake during repeated smoke runs. That directory is ignored by git and must not be uploaded as a CI artifact.

If a frontend dev server is already running, seed before starting it or restart the frontend after
seeding so server-side product data is not stale. Redis endpoint cache clearing is opt-in:

```powershell
$env:E2E_CLEAR_REDIS_CACHE = "1"
pnpm --filter @repo/backend seed:e2e
```

To validate against an already-seeded read-only target:

```powershell
$env:E2E_SEED_MODE = "skip"
$env:E2E_CUSTOMER_USER_ID = "123"
$env:E2E_ADMIN_USER_ID = "456"
pnpm e2e:smoke
```

To explicitly exercise the password-login endpoint instead of direct local JWT generation:

```powershell
$env:E2E_AUTH_MODE = "login"
pnpm e2e:smoke
```

To skip auth storage generation for a storefront-only debug run:

```powershell
$env:E2E_AUTH_MODE = "skip"
pnpm --filter @repo/e2e e2e --grep "@smoke" --grep-invert "authenticated|super-admin"
```

To remove the deterministic storefront fixtures:

```powershell
pnpm --filter @repo/backend seed:e2e -- --teardown
```

## Output

Playwright writes stable local/CI paths:

- `apps/e2e/e2e-results.xml`
- `apps/e2e/playwright-report/`
- `apps/e2e/test-results/`
- `apps/e2e/.auth/` for local generated auth state only

These paths are ignored by git. Do not store `.env` files, storage state, tokens, cookies, or auth artifacts in Playwright report output or CI artifacts.

## CI Status

`.gitlab-ci.yml` is intentionally unchanged in Phase 1. After local smoke passes, add a separate CI mini-plan before introducing a GitLab `test` or `verify` stage.
