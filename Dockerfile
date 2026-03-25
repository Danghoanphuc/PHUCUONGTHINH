FROM node:22.12-alpine

WORKDIR /app

COPY packages/backend/package*.json packages/backend/.npmrc ./packages/backend/
COPY packages/backend/prisma ./packages/backend/prisma/

WORKDIR /app/packages/backend
RUN npm install --legacy-peer-deps

COPY packages/backend/ .

RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
