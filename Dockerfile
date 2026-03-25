FROM node:22.12-slim AS builder

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    pkg-config \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install dependencies
COPY packages/backend/package*.json ./
COPY packages/backend/.npmrc ./
COPY packages/backend/prisma ./prisma/

RUN npm install --legacy-peer-deps
RUN npx prisma generate

# Copy source code
COPY packages/backend/src ./src/
COPY packages/backend/nest-cli.json ./
COPY packages/backend/tsconfig*.json ./

# Build the application
RUN npm run build
RUN echo "Build completed, checking dist folder:" && ls -la && ls -la dist/ || echo "dist folder not found!"

# Production stage
FROM node:22.12-slim

RUN apt-get update && apt-get install -y \
    libcairo2 \
    libpango-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY packages/backend/package*.json ./
COPY packages/backend/.npmrc ./

# Install production dependencies only
RUN npm install --legacy-peer-deps --omit=dev

# Copy prisma schema and generate client
COPY packages/backend/prisma ./prisma/
RUN npx prisma generate

# Copy built application from builder
COPY --from=builder /app/dist ./dist

RUN echo "Production stage, checking files:" && ls -la && ls -la dist/

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push && node dist/src/main"]
