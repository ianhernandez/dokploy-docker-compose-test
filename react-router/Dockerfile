FROM node:24-alpine AS dependencies-env
# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.12.4 --activate
COPY . /app
WORKDIR /app
RUN pnpm install --frozen-lockfile

FROM node:24-alpine AS build-env
# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.12.4 --activate
COPY . /app/
COPY --from=dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
# Generate Prisma client and build
RUN pnpm exec prisma generate
RUN pnpm run build

FROM node:24-alpine AS production-deps
# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.12.4 --activate
COPY ./package.json ./pnpm-lock.yaml /app/
WORKDIR /app
# Install only production dependencies and skip scripts
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

FROM node:24-alpine
# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.12.4 --activate
COPY ./package.json ./pnpm-lock.yaml /app/
COPY --from=production-deps /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
COPY --from=build-env /app/app/generated /app/app/generated
COPY --from=build-env /app/prisma /app/prisma
WORKDIR /app

# Install Prisma CLI for migrations
RUN pnpm add -D prisma

# Health check for container readiness
HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget --spider http://localhost:3000 || exit 1

# Run migrations then start server
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm run start"]
