FROM node:20-alpine

WORKDIR /app

# Install dependencies using npm (for local development)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Expose Strapi port
EXPOSE 1337

# Start Strapi in development mode with hot-reload
CMD ["npm", "run", "develop"]
