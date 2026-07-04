FROM ghcr.io/pnpm/pnpm:11 AS base
RUN pnpm runtime set node 26 -g

FROM base AS backend-build
WORKDIR /app/backend
COPY backend/package.json backend/pnpm-lock.yaml backend/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY backend/. .
# Commit metadata written by CI (bracket globs keep the COPY optional for local
# builds without them); the server logs these at startup as its version.
COPY .commit-tim[e] .commit-sh[a] ./
# Emit the OpenAPI spec the frontend generates its typed client from. Only needs
# the (prod) deps and no database, so it runs here in the backend stage.
RUN pnpm run gen:openapi openapi.json

FROM base AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml ./
# The nested codegen workspace member must be present for --frozen-lockfile.
COPY frontend/tools/openapi-codegen/package.json ./tools/openapi-codegen/
RUN pnpm install --frozen-lockfile
COPY frontend/. .
# Generate the typed API client from the backend spec (see `pnpm gen:api`). Both
# the spec and the derived types are gitignored, so they are produced here.
COPY --from=backend-build /app/backend/openapi.json ./src/store/openapi.json
RUN pnpm --filter openapi-codegen run gen
RUN pnpm run types
COPY .commit-tim[e] .commit-sh[a] ./
RUN LAST_MODIFIED="$(cat .commit-time 2>/dev/null || true)" COMMIT_SHA="$(cat .commit-sha 2>/dev/null || true)" pnpm run build-ci

FROM base
WORKDIR /app
COPY --from=backend-build /app/backend ./
COPY --from=frontend-build /app/frontend/dist ./public

ENV PUBLIC_DIR=/app/public
ENV DOCKER=true
EXPOSE 5512
CMD ["node", "src/index.ts"]
