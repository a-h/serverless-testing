# Install dependencies only when needed
FROM node:16 AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN npm ci

# Get local esbuild.
RUN mkdir esbuild && \
    curl -fsSL -o esbuild.tgz https://registry.npmjs.org/esbuild-linux-arm64/-/esbuild-linux-arm64-0.15.7.tgz && \
    tar xf ./esbuild.tgz && \
    cp ./package/bin/esbuild ./esbuild && \
    rm -rf package

# Rebuild the source code only when needed
FROM node:16 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/esbuild ./esbuild
COPY . .

RUN npm run build-ci

# Production image, copy all the files and run
FROM node:16 AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 app

COPY --from=builder /app/dist ./

USER app

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]

