# syntax=registry.cyandm.org/bel4/infinity/dockerfile:1.7
FROM docker.arvancloud.ir/node:20-alpine AS builder

ARG STRAPI_DISABLE_SOURCEMAPS=true
ARG STRAPI_TELEMETRY_DISABLED=true
ARG NODE_OPTIONS=""
ENV STRAPI_DISABLE_SOURCEMAPS=${STRAPI_DISABLE_SOURCEMAPS}
ENV STRAPI_TELEMETRY_DISABLED=${STRAPI_TELEMETRY_DISABLED}
ENV NODE_OPTIONS=${NODE_OPTIONS}
ENV NODE_ENV=production

WORKDIR /repo

# Arvan APK mirror + build deps so sharp compiles against system libvips (no GitHub binary)
RUN sed -i 's|https://dl-cdn.alpinelinux.org/alpine|https://mirror.arvancloud.ir/alpine|g' /etc/apk/repositories \
    && apk add --no-cache build-base python3 vips-dev fftw-dev

ENV npm_config_nodedir=/usr/local

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY packages ./packages
RUN --mount=type=cache,target=/root/.npm \
    corepack enable && pnpm install --filter @repo/backend... --frozen-lockfile

COPY apps/backend ./apps/backend
WORKDIR /repo/apps/backend
RUN pnpm run build && rm -rf .strapi
WORKDIR /repo
RUN pnpm --filter @repo/backend deploy --prod /app

FROM docker.arvancloud.ir/node:20-alpine AS runner

ARG STRAPI_DISABLE_SOURCEMAPS=true
ARG STRAPI_TELEMETRY_DISABLED=true
ARG NODE_OPTIONS=""
ENV NODE_ENV=production \
    STRAPI_TELEMETRY_DISABLED=${STRAPI_TELEMETRY_DISABLED} \
    STRAPI_DISABLE_SOURCEMAPS=${STRAPI_DISABLE_SOURCEMAPS} \
    NODE_OPTIONS=${NODE_OPTIONS}

RUN sed -i 's|https://dl-cdn.alpinelinux.org/alpine|https://mirror.arvancloud.ir/alpine|g' /etc/apk/repositories \
    && apk add --no-cache vips
RUN corepack enable

WORKDIR /app

COPY --from=builder /app /app

EXPOSE 1337
CMD ["pnpm", "run", "start:prod"]
