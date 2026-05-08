# Multi-stage Dockerfile for Edge TTS API
FROM node:20-alpine AS builder
WORKDIR /app

# Enable Corepack so the Yarn version from "packageManager" is used (Yarn 4)
RUN corepack enable

COPY nodejs_space/package.json nodejs_space/yarn.lock* ./
RUN yarn install --network-timeout 60000
COPY nodejs_space/ ./
RUN yarn build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Enable Corepack here too (runner stage also runs yarn)
RUN corepack enable

COPY nodejs_space/package.json nodejs_space/yarn.lock* ./
RUN yarn install --production --network-timeout 60000 && yarn cache clean
COPY --from=builder /app/dist ./dist
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/main.js"]
