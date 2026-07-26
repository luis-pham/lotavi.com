FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json apps/api/
COPY packages ./packages
RUN pnpm install --filter @lotiva/api...

FROM deps AS build
COPY . .
# Build packages in dependency order so declaration files exist before dependents typecheck.
RUN rm -rf packages/*/dist packages/*/tsconfig.tsbuildinfo \
  && pnpm --filter @lotiva/domain build \
  && pnpm --filter @lotiva/contracts build \
  && pnpm --filter @lotiva/application build \
  && pnpm --filter @lotiva/infrastructure build \
  && pnpm --filter @lotiva/api build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production LOTIVA_STORE=postgres VOICE_ENABLED=false ALLOW_DEMO_SEED=false ALLOW_MEMORY_STORE=false
RUN corepack enable
COPY --from=build /app /app
WORKDIR /app
EXPOSE 4000
CMD ["node", "apps/api/dist/server.js"]
