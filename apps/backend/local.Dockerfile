FROM docker.arvancloud.ir/node:20-alpine

WORKDIR /app

# Install backend workspace dependencies for local development.
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY packages ./packages
RUN corepack enable && pnpm install --filter @repo/backend... --frozen-lockfile

# Copy source code
COPY apps/backend ./apps/backend
WORKDIR /repo/apps/backend

# Expose Strapi port
EXPOSE 1337

# Start Strapi in development mode with hot-reload
CMD ["pnpm", "run", "develop"]
