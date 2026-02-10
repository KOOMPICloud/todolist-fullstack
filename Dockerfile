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
WORKDIR /frontend
COPY frontend/ ./
RUN bun run build

# ============================================
# Stage 4: Production Image
# ============================================
FROM oven/bun:1-alpine AS production

# Install Python for serving frontend (fallback)
RUN apk add --no-cache python3

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
ENV PORT=3001
ENV DATABASE_PATH=/data/db/app.db

# Expose ports
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:3001/api/health').read()"

# Start both backend and frontend
# Backend on port 3001, frontend served by Python on port 3000
CMD \
  echo "Starting application..." && \
  cd backend && bun run start & \
  echo "Backend started on port 3001" && \
  sleep 2 && \
  echo "Starting frontend on port 3000..." && \
  cd /app/frontend/dist && python3 -m http.server 3000
