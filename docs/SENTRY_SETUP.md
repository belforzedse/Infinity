# Sentry/Bugsink Error Tracking Setup

This document describes how to configure error tracking with Bugsink (Sentry-compatible) for the Infinity Store application.

## Overview

The application uses the Sentry SDK to send error reports to a self-hosted Bugsink instance. Both frontend (Next.js) and backend (Strapi) are configured to send errors.

## Bugsink Instance

Your Bugsink instance should be running at:
- **URL**: `https://errors.yourdomain.com` (e.g., `https://errors.infinitycolor.org`)
- **Projects**: Create separate projects for frontend and backend (recommended)

## Required CI/CD Variables

### GitHub Actions (Settings → Secrets and variables → Actions)

#### Frontend Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `FRONTEND_SENTRY_DSN` | DSN for frontend error tracking | `https://publickey@errors.infinitycolor.org/1` |

#### Backend Secrets

Backend DSN is passed via the env file (see below), not as a GitHub secret.

### GitLab CI/CD (Settings → CI/CD → Variables)

#### Frontend Variables (per environment)

| Variable | Description | Example | Protected | Masked |
|----------|-------------|---------|-----------|--------|
| `PROD_FRONTEND_SENTRY_DSN` | Production DSN | `https://key@errors.infinitycolor.org/1` | Yes | Yes |
| `STAGING_FRONTEND_SENTRY_DSN` | Staging DSN | `https://key@errors.infinitycolor.org/2` | Yes | Yes |

Note: GitLab CI uses environment-specific variables like `PROD_FRONTEND_SENTRY_DSN` and `STAGING_FRONTEND_SENTRY_DSN` which are mapped to `FRONTEND_SENTRY_DSN` in the build job.

#### Backend Variables

Backend DSN is passed via the env file on the server (see below), not as a GitLab variable.

## Required Environment Variables

### Frontend Environment File (`main.env` / `dev.env`)

The frontend Sentry DSN is baked into the build, so it comes from GitHub secrets. However, you can override it at runtime if needed (though it won't affect client-side errors):

```bash
# Optional: Runtime override (does not affect client-side errors which are baked at build)
NEXT_PUBLIC_SENTRY_DSN=https://publickey@errors.infinitycolor.org/1
```

### Backend Environment File (`main.env` / `dev.env`)

Add this line to your backend env file on the server (for both GitHub and GitLab deployments):

```bash
# Sentry/Bugsink Error Tracking (optional - leave empty to disable)
SENTRY_DSN=https://backendkey@errors.infinitycolor.org/2
```

For GitLab: The backend env file is set via the `BACKEND_ENV_FILE` variable (file type or variable content) and deployed to `/opt/infinity/backend/$ENV_FILE`.

## Getting the DSN from Bugsink

1. Log in to your Bugsink instance (`https://errors.yourdomain.com`)
2. Create a new project (or use an existing one)
3. Go to Project Settings → Client Keys (DSN)
4. Copy the DSN URL
5. Use the same DSN for frontend and backend, or create separate projects for each

## Files Modified for Sentry Integration

### Frontend

| File | Change |
|------|--------|
| `frontend/package.json` | Added `@sentry/nextjs` dependency |
| `frontend/next.config.ts` | Wrapped export with `withSentryConfig()` |
| `frontend/sentry.client.config.ts` | Created - Client-side Sentry init |
| `frontend/sentry.server.config.ts` | Created - Server-side Sentry init |
| `frontend/sentry.edge.config.ts` | Created - Edge runtime Sentry init |
| `frontend/instrumentation.ts` | Created - Registers Sentry configs |
| `frontend/src/app/error.tsx` | Added `Sentry.captureException(error)` |
| `frontend/main.Dockerfile` | Added `NEXT_PUBLIC_SENTRY_DSN` build arg |
| `frontend/dev.Dockerfile` | Added `NEXT_PUBLIC_SENTRY_DSN` build arg |
| `frontend/.env.example` | Added `NEXT_PUBLIC_SENTRY_DSN` |

### Backend

| File | Change |
|------|--------|
| `backend/package.json` | Added `@sentry/node` dependency |
| `backend/src/index.ts` | Added `Sentry.init()` at the top |
| `backend/.env.example` | Added `SENTRY_DSN` |

### CI/CD

| File | Change |
|------|--------|
| `.github/workflows/frontend-cicd.yml` | Added `NEXT_PUBLIC_SENTRY_DSN` build-arg |
| `.gitlab-ci.yml` | Added `FRONTEND_SENTRY_DSN` variable mapping and build-arg |

## Testing the Integration

### Frontend Test

Add this code temporarily to any page to trigger a test error:

```typescript
<button onClick={() => {
  throw new Error("Test frontend error");
}}>
  Trigger Test Error
</button>
```

### Backend Test

Add this to any controller temporarily:

```typescript
throw new Error("Test backend error");
```

### Verification

1. Trigger the test error
2. Check your Bugsink instance within a few minutes
3. The error should appear in the project dashboard

## Disabling Sentry

To disable error tracking without code changes:

- **Frontend**: Set `FRONTEND_SENTRY_DSN` secret to empty string in GitHub, or don't set it at all
- **Backend**: Remove or comment out `SENTRY_DSN` from the env file

Both configurations check if the DSN is set before initializing Sentry.

## Troubleshooting

### Errors not appearing in Bugsink

1. Check that the DSN is correct (copy from Bugsink project settings)
2. Verify network connectivity from the server to Bugsink
3. Check container logs: `docker logs <container_name>`
4. Ensure the environment variable is actually set in the container:
   ```bash
   docker exec <frontend_container> env | grep SENTRY
   docker exec <backend_container> env | grep SENTRY
   ```

### Frontend: Build-time vs Runtime

The frontend Sentry DSN is baked into the build because it needs to be available client-side. If you change the DSN:
- You must rebuild and redeploy the frontend
- Just changing the env file on the server won't affect client-side errors

### Backend: Runtime

The backend Sentry DSN is read at runtime, so you can change it by updating the env file and restarting the container.

## Security Considerations

- The frontend DSN uses a public key - it's safe to expose in client-side code
- The backend DSN can use a different key if you want to separate permissions
- Both DSNs should be stored as secrets (GitHub secrets for frontend build, server env file for backend)
- Bugsink runs on your own infrastructure, so error data stays within your control
