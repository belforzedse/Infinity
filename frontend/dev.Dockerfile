# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build arguments for environment variables
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_IMAGE_BASE_URL
ARG NEXT_PUBLIC_STRAPI_TOKEN

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code and dev.env
COPY . .

# Set NODE_ENV to development (so dev.env is loaded)
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# If build args provided, use them; otherwise read from dev.env
RUN if [ -z "$NEXT_PUBLIC_API_BASE_URL" ]; then \
      echo "Loading env vars from dev.env..."; \
      export $(grep -v '^#' dev.env | grep -v '^$' | xargs); \
    else \
      echo "Using provided build args..."; \
      export NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL; \
      export NEXT_PUBLIC_IMAGE_BASE_URL=$NEXT_PUBLIC_IMAGE_BASE_URL; \
      export NEXT_PUBLIC_STRAPI_TOKEN=$NEXT_PUBLIC_STRAPI_TOKEN; \
    fi && \
    echo "API URL: $NEXT_PUBLIC_API_BASE_URL" && \
    npm run build

# Production stage (runtime)
FROM node:20-alpine AS runner

WORKDIR /app

# Keep NODE_ENV as development for dev builds
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# Copy only necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"] 