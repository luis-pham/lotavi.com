FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json apps/api/
COPY packages ./packages
RUN pnpm install --filter @lotiva/api...

FROM deps AS build
COPY . .
RUN pnpm --filter @lotiva/api... build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production LOTIVA_STORE=postgres VOICE_ENABLED=false ALLOW_DEMO_SEED=false ALLOW_MEMORY_STORE=false
COPY --from=build /app /app
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["node", "dist/server.js"]
