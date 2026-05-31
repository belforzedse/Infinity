# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS builder

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

# Arvan APK mirror + build deps required to compile sharp against Alpine's libvips
# (avoids GitHub binary download which fails in CI due to network restrictions)
RUN fallback-apk.sh build-base python3 vips-dev fftw-dev

# node-gyp would otherwise download headers from unofficial-builds.nodejs.org (DNS failures in CI).
# Official node:alpine already installs headers under /usr/local/include/node.
ENV npm_config_nodedir=/usr/local

# Layer caching: workspace manifests first so code-only changes don't re-run install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY packages ./packages
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/root/.cache/node/corepack \
    fallback-registry.sh "${NPM_REGISTRY_URL}" "${NPM_REGISTRY_FALLBACK_URL}" \
    pnpm install --filter @repo/backend... --frozen-lockfile

COPY apps/backend ./apps/backend
WORKDIR /repo/apps/backend
RUN --mount=type=cache,target=/root/.cache/node/corepack \
    fallback-registry.sh "${NPM_REGISTRY_URL}" "${NPM_REGISTRY_FALLBACK_URL}" \
    pnpm run build \
    && echo "strapi build finished, removing build artifacts..." \
    && rm -rf .strapi .cache .tmp \
    && echo "strapi build step complete"
WORKDIR /repo
RUN --mount=type=cache,target=/root/.cache/node/corepack \
    echo "starting pnpm deploy..." \
    && fallback-registry.sh "${NPM_REGISTRY_URL}" "${NPM_REGISTRY_FALLBACK_URL}" \
    pnpm --filter @repo/backend deploy --legacy --prod /app \
    && echo "pnpm deploy finished, copying build output..." \
    && mkdir -p /app/dist /app/build \
    && cp -a /repo/apps/backend/dist/. /app/dist/ \
    && if [ -d /repo/apps/backend/build ]; then cp -a /repo/apps/backend/build/. /app/build/; fi \
    && cd /app \
    && echo "rebuilding sharp for musl runtime..." \
    && npm_config_platform=linux npm_config_arch=x64 npm_config_libc=musl pnpm rebuild sharp --unsafe-perm \
    && node -e "const sharp=require('sharp'); console.log('sharp-ok', process.platform, process.arch, sharp.versions);"

FROM node:20-alpine AS runner

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

# su-exec so entrypoint can create uploads dir then run as node
# Alpine default CDN (dl-cdn.alpinelinux.org) is often unreachable from same networks as Docker Hub; use Arvan APK mirror
RUN fallback-apk.sh su-exec vips vips-dev
# Reuse Corepack cache from builder so pnpm@10.28.2 activates without another registry fetch (CI mirrors / flaky networks).
COPY --from=builder /root/.cache/node/corepack /root/.cache/node/corepack
RUN mkdir -p /home/node/.cache/node \
    && cp -a /root/.cache/node/corepack /home/node/.cache/node/ \
    && chown -R node:node /home/node/.cache
RUN fallback-registry.sh "${NPM_REGISTRY_URL}" "${NPM_REGISTRY_FALLBACK_URL}" pnpm --version

WORKDIR /app

COPY --from=builder /app /app
RUN chmod +x /app/docker-entrypoint.sh && chown -R node:node /app

EXPOSE 1337
USER root
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["pnpm", "run", "start:prod"]
