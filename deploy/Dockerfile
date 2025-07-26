# Use the official Node.js 22 image as base
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install ALL dependencies (production + dev) for building
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps stage (includes both prod and dev deps)
COPY --from=deps /app/node_modules ./node_modules

# copies all your source code from your local project directory into the container
# respects .dockerignore (excludes node_modules, .git, etc.)
COPY . .

# Build the app - environment variables needed for build
# ARG allows you to pass build-time variables (in command line). It receives the values from --build-arg
# When container runs, the ARG variables are gone
ARG DB_URL
ARG DB_NAME

# ENV sets environment variables for the build process
# these variables will be available during the build process
ENV DB_URL=$DB_URL
ENV DB_NAME=$DB_NAME

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Stage 3: production-deps - Remove dev dependencies from existing node_modules
FROM base AS production-deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package.json and the complete node_modules from deps stage
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules

# Remove dev dependencies while keeping production ones
RUN npm prune --production

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Copy production dependencies from production-deps stage
COPY --from=production-deps /app/node_modules ./node_modules

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]
