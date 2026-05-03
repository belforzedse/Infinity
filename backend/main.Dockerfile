# syntax=registry.cyandm.org/bel4/infinity/dockerfile:1.7
FROM docker.arvancloud.ir/node:20-alpine AS builder

ARG STRAPI_DISABLE_SOURCEMAPS=true
ARG STRAPI_TELEMETRY_DISABLED=true
ARG NODE_OPTIONS=""
ENV STRAPI_DISABLE_SOURCEMAPS=${STRAPI_DISABLE_SOURCEMAPS}
ENV STRAPI_TELEMETRY_DISABLED=${STRAPI_TELEMETRY_DISABLED}
ENV NODE_OPTIONS=${NODE_OPTIONS}
ENV NODE_ENV=production

WORKDIR /app

# Arvan APK mirror + build deps required to compile sharp against Alpine's libvips
# (avoids GitHub binary download which fails in CI due to network restrictions)
RUN sed -i 's|https://dl-cdn.alpinelinux.org/alpine|https://mirror.arvancloud.ir/alpine|g' /etc/apk/repositories \
    && apk add --no-cache build-base python3 vips-dev fftw-dev

# Layer caching: deps first so code-only changes don't re-run npm ci
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps

COPY . .
RUN npm run build && rm -rf .strapi

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

WORKDIR /app

COPY --from=builder /app /app
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN --mount=type=cache,target=/root/.npm npm prune --omit=dev && chmod +x /app/docker-entrypoint.sh && chown -R node:node /app

EXPOSE 1337
USER root
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["npm", "run", "start:prod"]
