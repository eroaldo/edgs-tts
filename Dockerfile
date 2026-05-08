# Multi-stage Dockerfile for Edge TTS API
FROM node:20-alpine AS builder
WORKDIR /app
COPY nodejs_space/package.json nodejs_space/yarn.lock* ./
RUN yarn install --network-timeout 600000
COPY nodejs_space/ ./
RUN yarn build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY nodejs_space/package.json nodejs_space/yarn.lock* ./
RUN yarn install --production --network-timeout 600000 && yarn cache clean
COPY --from=builder /app/dist ./dist
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/main.js"]
