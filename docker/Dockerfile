ARG NODE_IMAGE=node:22-alpine
FROM ${NODE_IMAGE} AS admin-builder
WORKDIR /admin
ARG PNPM_VERSION=10.25.0
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
COPY admin/package.json admin/pnpm-lock.yaml admin/pnpm-workspace.yaml ./
COPY admin/packages ./packages
RUN pnpm install --frozen-lockfile
COPY admin/ ./
RUN pnpm run build

FROM ${NODE_IMAGE} AS backend-builder
WORKDIR /backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/ ./
COPY --from=admin-builder /admin/dist ./public/admin
RUN npm run build

FROM ${NODE_IMAGE}
WORKDIR /app
ENV NODE_ENV=production

LABEL org.opencontainers.image.title="Shanzhao"
LABEL org.opencontainers.image.description="WeChat Mini Program flash-photo backend, admin panel, and built-in MariaDB single-container deployment."
LABEL org.opencontainers.image.source="https://github.com/qiantingwl/shanzhao"
LABEL org.opencontainers.image.documentation="https://github.com/qiantingwl/shanzhao#readme"
LABEL org.opencontainers.image.vendor="qiantingwl"

RUN apk add --no-cache mariadb mariadb-client tzdata openssl

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=backend-builder /backend/dist ./dist
COPY --from=backend-builder /backend/public ./public
COPY docker/container-init.sql ./sql/container-init.sql
COPY docker/entrypoint.sh ./entrypoint.sh

RUN chmod +x /app/entrypoint.sh && mkdir -p /app/data /app/uploads /app/runtime /run/mysqld
EXPOSE 3000
VOLUME ["/app/data"]
CMD ["/app/entrypoint.sh"]
