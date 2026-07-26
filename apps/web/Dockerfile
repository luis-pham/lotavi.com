FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/web/package.json apps/web/
COPY packages ./packages
# Include contracts (design-system depends on it) plus web UI packages.
RUN pnpm install --filter @lotiva/web... --filter @lotiva/contracts...

FROM deps AS build
ARG NEXT_PUBLIC_API_URL=https://api.lotavi.com
ARG NEXT_PUBLIC_WEB_URL=https://lotavi.com
ARG NEXT_PUBLIC_SITE_ENV=production
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_WEB_URL=$NEXT_PUBLIC_WEB_URL \
    NEXT_PUBLIC_SITE_ENV=$NEXT_PUBLIC_SITE_ENV
COPY . .
RUN rm -rf packages/*/dist packages/*/tsconfig.tsbuildinfo apps/web/.next \
  && pnpm --filter @lotiva/contracts build \
  && pnpm --filter @lotiva/design-tokens build \
  && pnpm --filter @lotiva/design-system build \
  && pnpm --filter @lotiva/ui build \
  && pnpm --filter @lotiva/web build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY --from=build /app /app
WORKDIR /app
EXPOSE 3000
CMD ["sh", "-c", "corepack enable && exec pnpm --filter @lotiva/web start"]
