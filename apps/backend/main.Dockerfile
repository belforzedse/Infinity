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

# Arvan APK mirror + build deps required to compile sharp against Alpine's libvips
# (avoids GitHub binary download which fails in CI due to network restrictions)
RUN sed -i 's|https://dl-cdn.alpinelinux.org/alpine|https://mirror.arvancloud.ir/alpine|g' /etc/apk/repositories \
    && apk add --no-cache build-base python3 vips-dev fftw-dev

# node-gyp would otherwise download headers from unofficial-builds.nodejs.org (DNS failures in CI).
# Official node:alpine already installs headers under /usr/local/include/node.
ENV npm_config_nodedir=/usr/local

# Layer caching: workspace manifests first so code-only changes don't re-run install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY packages ./packages
RUN --mount=type=cache,target=/root/.npm \
    corepack enable && pnpm install --filter @repo/backend... --frozen-lockfile

COPY apps/backend ./apps/backend
WORKDIR /repo/apps/backend
RUN pnpm run build && rm -rf .strapi
WORKDIR /repo
RUN pnpm --filter @repo/backend deploy --legacy --prod /app \
    && mkdir -p /app/dist /app/build \
    && cp -a /repo/apps/backend/dist/. /app/dist/ \
    && if [ -d /repo/apps/backend/build ]; then cp -a /repo/apps/backend/build/. /app/build/; fi \
    && cd /app \
    && npm install --no-save --ignore-scripts=false --foreground-scripts --platform=linuxmusl --arch=x64 sharp@0.32.6 \
    && node -e "const sharp=require('sharp'); console.log('sharp-ok', process.platform, process.arch, sharp.versions);"

FROM docker.arvancloud.ir/node:20-alpine AS runner

ARG STRAPI_DISABLE_SOURCEMAPS=true
ARG STRAPI_TELEMETRY_DISABLED=true
ARG NODE_OPTIONS=""
ENV NODE_ENV=production \
    STRAPI_TELEMETRY_DISABLED=${STRAPI_TELEMETRY_DISABLED} \
    STRAPI_DISABLE_SOURCEMAPS=${STRAPI_DISABLE_SOURCEMAPS} \
    NODE_OPTIONS=${NODE_OPTIONS}

# su-exec so entrypoint can create uploads dir then run as node
# Alpine default CDN (dl-cdn.alpinelinux.org) is often unreachable from same networks as Docker Hub; use Arvan APK mirror
RUN sed -i 's|https://dl-cdn.alpinelinux.org/alpine|https://mirror.arvancloud.ir/alpine|g' /etc/apk/repositories \
    && apk add --no-cache su-exec vips
# Reuse Corepack cache from builder so pnpm@10.28.2 activates without another registry fetch (CI mirrors / flaky networks).
COPY --from=builder /root/.cache/node/corepack /root/.cache/node/corepack
RUN mkdir -p /home/node/.cache/node \
    && cp -a /root/.cache/node/corepack /home/node/.cache/node/ \
    && chown -R node:node /home/node/.cache
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

WORKDIR /app

COPY --from=builder /app /app
RUN chmod +x /app/docker-entrypoint.sh && chown -R node:node /app

EXPOSE 1337
USER root
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["pnpm", "run", "start:prod"]
