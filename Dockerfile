FROM node:22.12-slim

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

WORKDIR /app/packages/backend

COPY packages/backend/package*.json packages/backend/.npmrc ./
COPY packages/backend/prisma ./prisma/

RUN npm install --legacy-peer-deps

COPY packages/backend/ .

RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
