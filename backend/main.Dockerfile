FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production \
    STRAPI_TELEMETRY_DISABLED=true

COPY --from=builder /app /app
RUN npm prune --omit=dev

EXPOSE 1337
CMD ["npm", "run", "start:prod"]
