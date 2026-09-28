# Build the static bundle (+ PWA service worker), then serve it with nginx.
# Bun installs + runs scripts; Node stays the tools' runtime (matches CI).
FROM node:22-slim AS build
COPY --from=oven/bun:1.4.2-slim /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# Unprivileged variant: pid + temp paths live in /tmp, so it runs as the
# compose service's `user: 1000:1000`.
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 3000
