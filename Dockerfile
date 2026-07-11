FROM ghcr.io/pnpm/pnpm:11 AS base
RUN pnpm runtime set node 26 -g

# Builds the WASM PDF and HTML renderers the frontend imports from
# frontend/src/wasm/ (see renderer/justfile's build-wasm-pdf/build-wasm-html
# recipes) - this image needs the Rust toolchain instead, so they're built as
# their own stage and copied into frontend-build below rather than run via a
# pnpm hook.
FROM rust:1.95-slim-bookworm AS wasm-build
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates build-essential pkg-config \
    && rm -rf /var/lib/apt/lists/*
RUN rustup target add wasm32-unknown-unknown
RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
WORKDIR /app/renderer
COPY renderer/. ./
RUN wasm-pack build songbook-render-pdf --target bundler \
    --out-dir ../frontend-wasm/songbook-render-pdf --out-name songbook_render_pdf
RUN wasm-pack build songbook-render-html --target bundler \
    --out-dir ../frontend-wasm/songbook-render-html --out-name songbook_render_html

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
# The nested codegen workspace member must be present for --frozen-lockfile.
COPY frontend/tools/openapi-codegen/package.json ./frontend/tools/openapi-codegen/
RUN pnpm install --frozen-lockfile

FROM deps AS backend-build
WORKDIR /app
COPY backend/. ./backend/
# Commit metadata written by CI (bracket globs keep the COPY optional for local
# builds without them); the server logs these at startup as its version.
COPY .commit-tim[e] .commit-sh[a] ./backend/
# Emit the OpenAPI spec the frontend generates its typed client from. Only needs
# the (prod) deps and no database, so it runs here in the backend stage.
RUN pnpm --filter songbook-backend run gen:openapi openapi.json
# Prune to a self-contained, prod-only copy of the backend package for the final image.
RUN pnpm --filter songbook-backend deploy --prod --legacy /app/backend-deploy

FROM deps AS frontend-build
WORKDIR /app
COPY frontend/. ./frontend/
# Generate the typed API client from the backend spec (see `pnpm gen:api`). Both
# the spec and the derived types are gitignored, so they are produced here.
COPY --from=backend-build /app/backend/openapi.json ./frontend/src/store/openapi.json
RUN pnpm --filter openapi-codegen run gen
RUN pnpm --filter songbook-frontend run types
# Also gitignored - built above in wasm-build, since this image has no Rust toolchain.
COPY --from=wasm-build /app/renderer/frontend-wasm/songbook-render-pdf ./frontend/src/wasm/songbook-render-pdf
COPY --from=wasm-build /app/renderer/frontend-wasm/songbook-render-html ./frontend/src/wasm/songbook-render-html
COPY .commit-tim[e] .commit-sh[a] ./frontend/
WORKDIR /app/frontend
RUN LAST_MODIFIED="$(cat .commit-time 2>/dev/null || true)" COMMIT_SHA="$(cat .commit-sha 2>/dev/null || true)" pnpm run build-ci

FROM base
WORKDIR /app
COPY --from=backend-build /app/backend-deploy ./
COPY --from=frontend-build /app/frontend/dist ./public

ENV PUBLIC_DIR=/app/public
ENV DOCKER=true
EXPOSE 5512
CMD ["node", "src/index.ts"]
