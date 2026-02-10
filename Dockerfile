# Multi-stage Dockerfile for Full-Stack Application
# Runs both frontend (Vite) and backend (Bun) in one container

# ============================================
# Stage 1: Backend Dependencies
# ============================================
FROM oven/bun:1-alpine AS backend-deps
WORKDIR /backend
COPY backend/package.json backend/bun.lock* ./
RUN bun install --frozen-lockfile --production

# ============================================
# Stage 2: Frontend Dependencies
# ============================================
FROM oven/bun:1-alpine AS frontend-deps
WORKDIR /frontend
COPY frontend/package.json frontend/bun.lock* ./
RUN bun install --frozen-lockfile

# ============================================
# Stage 3: Build Frontend
# ============================================
FROM frontend-deps AS frontend-build
# Copy .env file from repo root to frontend directory for Vite
COPY .env* ./frontend/
# Copy all frontend source files (./ copies contents to current dir /frontend)
COPY frontend/ ./
RUN bun run build

# ============================================
# Stage 4: Production Image
# ============================================
FROM oven/bun:1-alpine AS production

# Create app directories
WORKDIR /app

# Copy backend
COPY backend/ ./backend/
COPY --from=backend-deps /backend/node_modules ./backend/node_modules

# Copy frontend build
COPY --from=frontend-build /frontend/dist ./frontend/dist

# Create data directory for SQLite database
RUN mkdir -p /data/db

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/data/db/app.db

# Expose port (backend serves both API and static files)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun -e "require('http').get('http://localhost:3000/api/health', (r) => { if (r.statusCode !== 200) throw new Error('Health check failed') })"

# Start backend server (serves both API and static frontend files)
WORKDIR /app/backend
CMD ["bun", "src/index.ts"]
