# syntax=registry.cyandm.org/bel4/infinity/dockerfile:1.7
FROM docker.arvancloud.ir/node:20-alpine AS builder

ARG STRAPI_DISABLE_SOURCEMAPS=true
ARG STRAPI_TELEMETRY_DISABLED=true
ARG NODE_OPTIONS=""
ARG NPM_REGISTRY_URL="https://package-mirror.liara.ir/repository/npm/"
ARG NPM_REGISTRY_FALLBACK_URL="https://registry.npmjs.org/"
ENV STRAPI_DISABLE_SOURCEMAPS=${STRAPI_DISABLE_SOURCEMAPS}
ENV STRAPI_TELEMETRY_DISABLED=${STRAPI_TELEMETRY_DISABLED}
ENV NODE_OPTIONS=${NODE_OPTIONS}
ENV NODE_ENV=production

WORKDIR /repo

COPY .cursor/docker/fallback-apk.sh .cursor/docker/fallback-registry.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/fallback-apk.sh /usr/local/bin/fallback-registry.sh

# Arvan APK mirror + build deps so sharp compiles against system libvips (no GitHub binary)
RUN fallback-apk.sh build-base python3 vips-dev fftw-dev

ENV npm_config_nodedir=/usr/local

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY packages ./packages
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/root/.cache/node/corepack \
    fallback-registry.sh "${NPM_REGISTRY_URL}" "${NPM_REGISTRY_FALLBACK_URL}" \
    pnpm install --filter @repo/backend... --frozen-lockfile

COPY apps/backend ./apps/backend
WORKDIR /repo/apps/backend
RUN pnpm run build && rm -rf .strapi
WORKDIR /repo
RUN pnpm --filter @repo/backend deploy --legacy --prod /app \
    && cd /app \
    && npm_config_platform=linux npm_config_arch=x64 npm_config_libc=musl pnpm rebuild sharp --unsafe-perm \
    && node -e "const sharp=require('sharp'); console.log('sharp-ok', process.platform, process.arch, sharp.versions);"

FROM docker.arvancloud.ir/node:20-alpine AS runner

ARG STRAPI_DISABLE_SOURCEMAPS=true
ARG STRAPI_TELEMETRY_DISABLED=true
ARG NODE_OPTIONS=""
ARG NPM_REGISTRY_URL="https://package-mirror.liara.ir/repository/npm/"
ARG NPM_REGISTRY_FALLBACK_URL="https://registry.npmjs.org/"
ENV NODE_ENV=production \
    STRAPI_TELEMETRY_DISABLED=${STRAPI_TELEMETRY_DISABLED} \
    STRAPI_DISABLE_SOURCEMAPS=${STRAPI_DISABLE_SOURCEMAPS} \
    NODE_OPTIONS=${NODE_OPTIONS}

COPY .cursor/docker/fallback-apk.sh .cursor/docker/fallback-registry.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/fallback-apk.sh /usr/local/bin/fallback-registry.sh

RUN fallback-apk.sh vips vips-dev
RUN fallback-registry.sh "${NPM_REGISTRY_URL}" "${NPM_REGISTRY_FALLBACK_URL}" pnpm --version

WORKDIR /app

COPY --from=builder /app /app

EXPOSE 1337
CMD ["pnpm", "run", "start:prod"]
