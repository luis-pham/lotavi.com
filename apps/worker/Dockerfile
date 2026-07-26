FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/worker/package.json apps/worker/
COPY packages ./packages
RUN pnpm install --filter @lotiva/worker...

FROM deps AS build
COPY . .
# Build packages in dependency order so declaration files exist before dependents typecheck.
RUN rm -rf packages/*/dist packages/*/tsconfig.tsbuildinfo \
  && pnpm --filter @lotiva/domain build \
  && pnpm --filter @lotiva/contracts build \
  && pnpm --filter @lotiva/application build \
  && pnpm --filter @lotiva/infrastructure build \
  && pnpm --filter @lotiva/worker build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production LOTIVA_STORE=postgres ALLOW_MEMORY_STORE=false VOICE_ENABLED=false
COPY --from=build /app /app
WORKDIR /app/apps/worker
CMD ["node", "dist/index.js"]
