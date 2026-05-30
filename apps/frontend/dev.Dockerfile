# syntax=docker.arvancloud.ir/docker/dockerfile:1.7
FROM docker.arvancloud.ir/node:22-alpine AS builder

WORKDIR /repo
ENV NEXT_TELEMETRY_DISABLED=1
ARG NPM_REGISTRY_URL="https://package-mirror.liara.ir/repository/npm/"
ARG NPM_REGISTRY_FALLBACK_URL="https://registry.npmjs.org/"

COPY .cursor/docker/fallback-registry.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/fallback-registry.sh

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/frontend/package.json ./apps/frontend/package.json
COPY packages ./packages
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/root/.cache/node/corepack \
    fallback-registry.sh "${NPM_REGISTRY_URL}" "${NPM_REGISTRY_FALLBACK_URL}" \
    pnpm install --filter @repo/frontend... --frozen-lockfile

COPY apps/frontend ./apps/frontend

ARG NEXT_PUBLIC_API_BASE_URL=""
ARG NEXT_PUBLIC_IMAGE_BASE_URL=""
ARG NEXT_PUBLIC_STRAPI_TOKEN=""
ARG NEXT_PUBLIC_SITE_URL=""
ARG NEXT_PUBLIC_MATOMO_URL=""
ARG NEXT_PUBLIC_MATOMO_SITE_ID=""
ARG NEXT_PUBLIC_SENTRY_DSN=""
ARG STRAPI_BUILD_TIME_URL=""
ARG STRAPI_INTERNAL_URL=""
ARG FRONTEND_REDIS_URL=""
ARG GITHUB_SHA=""

ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_IMAGE_BASE_URL=${NEXT_PUBLIC_IMAGE_BASE_URL}
ENV NEXT_PUBLIC_STRAPI_TOKEN=${NEXT_PUBLIC_STRAPI_TOKEN}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_PUBLIC_MATOMO_URL=${NEXT_PUBLIC_MATOMO_URL}
ENV NEXT_PUBLIC_MATOMO_SITE_ID=${NEXT_PUBLIC_MATOMO_SITE_ID}
ENV NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN}
ENV STRAPI_BUILD_TIME_URL=${STRAPI_BUILD_TIME_URL}
ENV STRAPI_INTERNAL_URL=${STRAPI_INTERNAL_URL}
ENV FRONTEND_REDIS_URL=${FRONTEND_REDIS_URL}
ENV GITHUB_SHA=${GITHUB_SHA}

WORKDIR /repo/apps/frontend
RUN NODE_ENV=production pnpm run build

FROM docker.arvancloud.ir/node:22-alpine AS runner
WORKDIR /app

# Runtime env: STRAPI_INTERNAL_URL, FRONTEND_REDIS_URL (STRAPI_BUILD_TIME_URL is build-only).
ARG STRAPI_INTERNAL_URL=""
ARG FRONTEND_REDIS_URL=""

ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    STRAPI_INTERNAL_URL=${STRAPI_INTERNAL_URL} \
    FRONTEND_REDIS_URL=${FRONTEND_REDIS_URL}

COPY --from=builder /repo/apps/frontend/.next/standalone ./
COPY --from=builder /repo/apps/frontend/public ./apps/frontend/public
COPY --from=builder /repo/apps/frontend/.next/static ./apps/frontend/.next/static

EXPOSE 3000

CMD ["node", "apps/frontend/server.js"]
