# Use Node.js 20 Alpine as base image
FROM node:20-alpine

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Create applogs directory for logging
RUN mkdir -p /app/applogs

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Expose port
EXPOSE 8000

# Start the application in development mode
CMD ["pnpm", "run", "start:dev"]