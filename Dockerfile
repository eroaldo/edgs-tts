# Multi-stage Dockerfile for Edge TTS API
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable

# Copia TUDO primeiro, depois instala (evita sobrescrever o estado do Yarn PnP)
COPY nodejs_space/ ./
RUN yarn install --network-timeout 60000
RUN yarn build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN corepack enable

COPY nodejs_space/package.json nodejs_space/yarn.lock* ./
COPY --from=builder /app/.yarn ./.yarn
COPY --from=builder /app/.pnp.cjs ./.pnp.cjs 2>/dev/null || true
COPY --from=builder /app/.pnp.loader.mjs ./.pnp.loader.mjs 2>/dev/null || true

RUN yarn install --network-timeout 60000 && yarn cache clean

COPY --from=builder /app/dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/main.js"]
