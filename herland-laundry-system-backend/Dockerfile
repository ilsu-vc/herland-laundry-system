# =============================================================
# Herland Laundry System — Backend Dockerfile
# =============================================================
# Multi-stage build:
#   Stage 1 (deps)    — install only production dependencies
#   Stage 2 (dev)     — adds devDependencies + nodemon for local dev
#   Stage 3 (prod)    — lean production image (~60 MB)
# =============================================================

# ---------- Stage 1: Install production dependencies ----------
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# ---------- Stage 2: Development (hot-reload via nodemon) ------
FROM node:20-alpine AS dev
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=development
ENV PORT=5000
EXPOSE 5000

# nodemon watches for file changes inside the container
CMD ["npm", "run", "dev"]

# ---------- Stage 3: Production --------------------------------
FROM node:20-alpine AS production
WORKDIR /app

# Copy only the production node_modules from Stage 1
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./

# Copy application source
COPY src ./src

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

# Health-check: hit a lightweight endpoint every 30s
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/v1/health || exit 1

# Run with plain node (no dev tooling in production)
CMD ["node", "src/server.js"]
