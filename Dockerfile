FROM ghcr.io/pnpm/pnpm:11 AS base
RUN pnpm runtime set node 26 -g

FROM base AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY frontend/. .
RUN pnpm build

FROM base AS backend-build
WORKDIR /app/backend
COPY backend/package.json backend/pnpm-lock.yaml backend/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY backend/. .

FROM base
WORKDIR /app
COPY --from=backend-build /app/backend ./
COPY --from=frontend-build /app/frontend/dist ./public

ENV PUBLIC_DIR=/app/public
ENV DOCKER=true
EXPOSE 5512
CMD ["node", "src/index.ts"]
