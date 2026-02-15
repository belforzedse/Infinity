# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS builder

ARG STRAPI_DISABLE_SOURCEMAPS=true
ARG STRAPI_TELEMETRY_DISABLED=true
ARG NODE_OPTIONS=""
ENV STRAPI_DISABLE_SOURCEMAPS=${STRAPI_DISABLE_SOURCEMAPS}
ENV STRAPI_TELEMETRY_DISABLED=${STRAPI_TELEMETRY_DISABLED}
ENV NODE_OPTIONS=${NODE_OPTIONS}
ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

ARG STRAPI_DISABLE_SOURCEMAPS=true
ARG STRAPI_TELEMETRY_DISABLED=true
ARG NODE_OPTIONS=""
ENV NODE_ENV=production \
    STRAPI_TELEMETRY_DISABLED=${STRAPI_TELEMETRY_DISABLED} \
    STRAPI_DISABLE_SOURCEMAPS=${STRAPI_DISABLE_SOURCEMAPS} \
    NODE_OPTIONS=${NODE_OPTIONS}

# su-exec so entrypoint can create uploads dir then run as node
RUN apk add --no-cache su-exec

WORKDIR /app

COPY --from=builder /app /app
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN --mount=type=cache,target=/root/.npm npm prune --omit=dev && chmod +x /app/docker-entrypoint.sh && chown -R node:node /app

EXPOSE 1337
USER root
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["npm", "run", "start:prod"]
