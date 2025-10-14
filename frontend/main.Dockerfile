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

# Copy source code and main.env
COPY . .

# Set NODE_ENV to production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# If build args provided, use them; otherwise read from main.env
RUN if [ -z "$NEXT_PUBLIC_API_BASE_URL" ]; then \
      echo "Loading env vars from main.env..."; \
      export $(grep -v '^#' main.env | grep -v '^$' | xargs); \
    else \
      echo "Using provided build args..."; \
      export NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL; \
      export NEXT_PUBLIC_IMAGE_BASE_URL=$NEXT_PUBLIC_IMAGE_BASE_URL; \
      export NEXT_PUBLIC_STRAPI_TOKEN=$NEXT_PUBLIC_STRAPI_TOKEN; \
    fi && \
    echo "API URL: $NEXT_PUBLIC_API_BASE_URL" && \
    npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy only necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"] 