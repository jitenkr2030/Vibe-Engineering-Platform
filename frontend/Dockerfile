# ============================================
# Build Stage - Install dependencies and build Next.js application
# ============================================
FROM node:20-alpine AS builder

# Set build arguments
ARG NODE_ENV=production
ARG PORT=3000

# Set environment variables for build
ENV NODE_ENV=${NODE_ENV}
ENV PORT=${PORT}

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./
COPY next.config.js ./
COPY tailwind.config.ts ./
COPY tsconfig.json ./

# Install dependencies with cache
RUN npm ci

# Copy source code
COPY . .

# Build the Next.js application
RUN npm run build

# ============================================
# Production Stage - Minimal runtime image
# ============================================
FROM node:20-alpine AS production

# Set build arguments
ARG NODE_ENV=production
ARG PORT=3000

# Set environment variables
ENV NODE_ENV=${NODE_ENV}
ENV PORT=${PORT}

WORKDIR /app

# Install dumb-init for proper signal handling in containers
RUN apk add --no-cache dumb-init curl

# Create non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Copy package files for production dependencies
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Change to non-root user
USER appuser

# Expose the application port
EXPOSE ${PORT}

# Health check configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD dumb-init -- curl -f http://localhost:${PORT} || exit 1

# Entrypoint with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start command
CMD ["npm", "run", "start"]
