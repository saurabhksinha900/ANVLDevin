FROM node:20-alpine AS builder
WORKDIR /app
RUN npm config set strict-ssl false
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate --schema prisma/schema.prisma
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./
RUN mkdir -p uploads
EXPOSE 3000
CMD ["sh", "-c", "npx prisma db push --schema prisma/schema.prisma --accept-data-loss && node dist/index.js"]
