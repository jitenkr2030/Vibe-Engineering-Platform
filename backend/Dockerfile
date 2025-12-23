# ============================================
# Build Stage - Compile TypeScript and prepare dependencies
# ============================================
FROM node:20-alpine AS builder

# Set build arguments
ARG NODE_ENV=production
ARG PORT=3001

# Set environment variables for build
ENV NODE_ENV=${NODE_ENV}
ENV PORT=${PORT}

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

# Install dependencies with cache
RUN npm ci --only=production && \
    npx prisma generate

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p ./uploads

# Generate Prisma client and build
RUN npx prisma generate && \
    npm run build

# ============================================
# Production Stage - Minimal runtime image
# ============================================
FROM node:20-alpine AS production

# Set build arguments
ARG NODE_ENV=production
ARG PORT=3001

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
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --only=production && \
    npx prisma generate

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/uploads ./uploads

# Set ownership of uploads directory
RUN chown -R appuser:appgroup ./uploads

# Change to non-root user
USER appuser

# Expose the application port
EXPOSE ${PORT}

# Health check configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD dumb-init -- curl -f http://localhost:${PORT}/health || exit 1

# Entrypoint with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start command
CMD ["node", "dist/index.js"]
