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

# Load environment variables from main.env if build args not provided
RUN if [ -z "$NEXT_PUBLIC_API_BASE_URL" ]; then \
      echo "Loading env vars from main.env..."; \
      set -a; \
      . ./main.env; \
      set +a; \
    else \
      echo "Using provided build args..."; \
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