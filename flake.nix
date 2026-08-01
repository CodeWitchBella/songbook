{
  inputs = {
    flake-root.url = "github:srid/flake-root";
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-parts.url = "github:hercules-ci/flake-parts";
    make-shell.url = "github:nicknovitski/make-shell";
    process-compose-flake.url = "github:Platonic-Systems/process-compose-flake";
    treefmt-nix.url = "github:numtide/treefmt-nix";
    treefmt-nix.inputs.nixpkgs.follows = "nixpkgs";
    rust-overlay.url = "github:oxalica/rust-overlay";
  };

  outputs = inputs @ {flake-parts, ...}:
    flake-parts.lib.mkFlake {inherit inputs;} {
      systems = ["x86_64-linux" "aarch64-linux"];
      imports = [
        inputs.flake-root.flakeModule
        inputs.make-shell.flakeModules.default
        inputs.process-compose-flake.flakeModule
        inputs.treefmt-nix.flakeModule
      ];
      perSystem = {
        config,
        pkgs,
        system,
        lib,
        ...
      }: let
        psql = pkgs.postgresql_18;
        # Client tools only: the full package's `postgres` binary would shadow
        # the `postgres` wrapper below on the dev shell PATH.
        psql-client = pkgs.runCommand "postgresql-client-tools" {} ''
          mkdir -p $out/bin
          for tool in psql pg_dump pg_dumpall pg_restore pg_isready createdb dropdb; do
            ln -s ${psql}/bin/$tool $out/bin/$tool
          done
        '';

        # PostgreSQL runs in a podman container, with its data in `.tmp/pgdata`
        # and its unix socket in `.tmp/pgsock` of this checkout, so every
        # worktree gets its own instance without any shared port. The container
        # name is derived from the checkout path to keep worktrees apart.
        pgImage = "docker.io/library/postgres:18-alpine";
        pgCommon = ''
          root=$(${lib.getExe config.flake-root.package})
          pghash=$(printf '%s' "$root" | cksum | cut -d' ' -f1)
          # shellcheck disable=SC2034 # not every caller uses all of these
          pgdata="$root/.tmp/pgdata"
          pgsock="$root/.tmp/pgsock"
          # shellcheck disable=SC2034
          pgname="songbook-postgres-$pghash"
          mkdir -p "$pgdata" "$pgsock"
        '';
        # `extraArgs` tune how the container is run (e.g. `-d` to detach).
        # --userns=keep-id + --user makes the data and socket files owned by the
        # host user; :Z relabels the bind mounts for SELinux. No port is
        # published: the socket directory is the only way in.
        pgPodman = extraArgs: redirect: ''
          podman run --replace --name "$pgname" ${extraArgs} \
            --userns=keep-id --user "$(id -u):$(id -g)" \
            -e POSTGRES_HOST_AUTH_METHOD=trust \
            -e POSTGRES_USER=postgres \
            -e POSTGRES_DB=songbook \
            -v "$pgdata:/var/lib/postgresql:Z" \
            -v "$pgsock:/var/run/postgresql:Z" \
            ${pgImage} -c listen_addresses= ${redirect}
        '';

        # Prints this checkout's socket directory, so anything that needs to
        # connect (dev shell, process-compose) agrees on where the socket is.
        postgres-socket = pkgs.writeShellApplication {
          name = "postgres-socket";
          runtimeInputs = [pkgs.coreutils];
          text = ''
            ${pgCommon}
            echo "$pgsock"
          '';
        };

        # Connection environment for clients. The URL carries no host on
        # purpose: postgres.js (and therefore drizzle-kit) only honours a unix
        # socket path through PGHOST, not through a `?host=` URL parameter.
        pgEnv = ''
          export PGHOST="$(${lib.getExe postgres-socket})"
          export PGUSER="postgres"
          export PGDATABASE="songbook"
          export POSTGRESQL_URL="postgresql:///songbook"
        '';

        postgres = pkgs.writeShellApplication {
          name = "postgres";
          runtimeInputs = [pkgs.podman pkgs.coreutils];
          text = ''
            ${pgCommon}
            exec ${pgPodman "--rm -it --init" ""}
          '';
        };

        postgres-start = pkgs.writeShellApplication {
          name = "postgres-start";
          runtimeInputs = [pkgs.podman pkgs.coreutils psql];
          text = ''
            ${pgCommon}
            ${pgPodman "-d" ">/dev/null"}
            for _ in $(seq 60); do
              if pg_isready -h "$pgsock" -q; then break; fi
              sleep 1
            done
            echo "PostgreSQL ($pgname) listening on $pgsock"
          '';
        };

        postgres-ready = pkgs.writeShellApplication {
          name = "postgres-ready";
          runtimeInputs = [pkgs.coreutils psql];
          text = ''
            ${pgCommon}
            exec pg_isready -h "$pgsock" -q
          '';
        };

        postgres-stop = pkgs.writeShellApplication {
          name = "postgres-stop";
          runtimeInputs = [pkgs.podman pkgs.coreutils];
          text = ''
            ${pgCommon}
            podman rm -f "$pgname"
          '';
        };

        # Run the Playwright server inside podman, pinned to the version declared
        # in frontend/package.json so the client library and server always match.
        playwrightVersion = (lib.importJSON ./frontend/package.json).devDependencies.playwright;
        # The Playwright server listens here; the Vitest storybook project reads
        # this via PLAYWRIGHT_WS_ENDPOINT to connect instead of launching a local
        # browser (see frontend/vitest.config.ts).
        playwrightWsEndpoint = "ws://localhost:3000/";
        # Run the pinned Playwright server image via podman; `extraArgs` tune how
        # the container is run (e.g. `-d` to detach, `--rm` for the foreground).
        playwrightPodman = extraArgs: ''
          podman run --rm --replace --name playwright-server --network host ${extraArgs} \
            mcr.microsoft.com/playwright:v${playwrightVersion}-noble \
            /bin/sh -c "npx -y playwright@${playwrightVersion} run-server --port 3000 --host 0.0.0.0"
        '';
        playwright-start = pkgs.writeShellApplication {
          name = "playwright-start";
          text = ''
            ${playwrightPodman "-d"}
            echo "Playwright server (v${playwrightVersion}) listening on ${playwrightWsEndpoint}"
          '';
        };

        playwright-stop = pkgs.writeShellApplication {
          name = "playwright-stop";
          text = ''
            podman rm -f playwright-server
          '';
        };

        playwright = pkgs.writeShellApplication {
          name = "playwright";
          text = "exec ${playwrightPodman "-it --init"}";
        };

        treefmt-pre-commit = pkgs.writeShellApplication {
          name = "treefmt-pre-commit";
          runtimeInputs = [config.treefmt.build.wrapper pkgs.git];
          text = ''
            files=$(git diff --cached --name-only --diff-filter=ACMR)
            [ -z "$files" ] && exit 0
            # shellcheck disable=SC2086
            treefmt --fail-on-change --no-cache $files
          '';
        };

        cargo-fmt-pre-commit = pkgs.writeShellApplication {
          name = "cargo-fmt-pre-commit";
          runtimeInputs = [pkgs.git pkgs.cargo pkgs.rustc];
          text = ''
            root=$(git rev-parse --show-toplevel)
            files=$(git -C "$root" diff --cached --name-only --diff-filter=ACMR -- 'renderer/*.rs' 'renderer/*Cargo.toml' 'renderer/*Cargo.lock')
            [ -z "$files" ] && exit 0
            cd "$root/renderer"
            status=0
            cargo fmt --all || status=$?
            # shellcheck disable=SC2086
            if ! git -C "$root" diff --quiet -- $files; then
              echo "cargo fmt applied fixes (left unstaged); review and re-stage them." >&2
              status=1
            fi
            exit $status
          '';
        };

        cargo-check-pre-commit = pkgs.writeShellApplication {
          name = "cargo-check-pre-commit";
          runtimeInputs = [pkgs.git pkgs.cargo pkgs.rustc];
          text = ''
            root=$(git rev-parse --show-toplevel)
            [ -z "$(git -C "$root" diff --cached --name-only --diff-filter=ACMR -- 'renderer/*.rs' 'renderer/*Cargo.toml' 'renderer/*Cargo.lock')" ] && exit 0
            cd "$root/renderer"
            exec cargo check --all-targets
          '';
        };

        mkWorkspaceHook = workspace: {
          tool,
          args ? "",
          scoped ? false,
          pre ? "",
        }:
          pkgs.writeShellApplication {
            name = "pre-commit-${workspace}-${tool}";
            runtimeInputs = [pkgs.git pkgs.pnpm pkgs.nodejs_26];
            text =
              if scoped
              then ''
                cd "$(git rev-parse --show-toplevel)/${workspace}"
                files=$(git diff --cached --name-only --diff-filter=ACMR --relative -- . | grep -E '\.(m|c)?[jt]sx?$' || true)
                [ -z "$files" ] && exit 0
                status=0
                # shellcheck disable=SC2086
                pnpm exec ${tool} ${args} $files || status=$?
                # shellcheck disable=SC2086
                if ! git diff --quiet -- $files; then
                  echo "${tool} applied fixes (left unstaged); review and re-stage them." >&2
                  status=1
                fi
                exit $status
              ''
              else ''
                root=$(git rev-parse --show-toplevel)
                [ -z "$(git -C "$root" diff --cached --name-only --diff-filter=ACMR -- ${workspace}/)" ] && exit 0
                cd "$root/${workspace}"
                ${pre}
                exec pnpm exec ${tool} ${args}
              '';
          };

        # All config-based Git pre-commit hooks, as name -> command path. The
        # per-workspace lint/format/typecheck hooks are generated so frontend
        # and backend share one definition each.
        workspaceTools = workspace: [
          {
            tool = "oxfmt";
            scoped = true;
          }
          {
            tool = "oxlint";
            args = "--fix";
            scoped = true;
          }
          {
            tool = "tsc";
            args = "--noEmit";
            # api-schema.d.ts and resources.d.ts are gitignored generated
            # files that the frontend types depend on; regenerate them before
            # typechecking so tsc doesn't fail on a fresh checkout or after
            # the backend schema/translations changed.
            pre =
              if workspace == "frontend"
              then "pnpm run gen:api && pnpm run types"
              else "";
          }
        ];
        preCommitHooks =
          {
            treefmt = lib.getExe treefmt-pre-commit;
            cargo-fmt = lib.getExe cargo-fmt-pre-commit;
            cargo-check = lib.getExe cargo-check-pre-commit;
          }
          // lib.listToAttrs (lib.concatMap (workspace:
            map (t:
              lib.nameValuePair "${workspace}-${t.tool}"
              (lib.getExe (mkWorkspaceHook workspace t)))
            (workspaceTools workspace))
          ["frontend" "backend"]);
      in {
        _module.args.pkgs = import inputs.nixpkgs {
          inherit system;
          overlays = [inputs.rust-overlay.overlays.default];
          config = {};
        };

        treefmt.config = {
          projectRootFile = "flake.nix";
          package = pkgs.treefmt;
          programs = {
            alejandra.enable = true;
            deadnix.enable = true;
          };
        };

        make-shells.default = {
          packages = with pkgs; [
            psql-client # psql, pg_dump, ...; the server runs in podman
            postgres
            postgres-start
            postgres-stop
            postgres-socket
            git #>= 2.54, for config-based hooks (hook.<name>.event/command)
            pnpm
            nodejs_26
            playwright
            playwright-start
            playwright-stop
            cargo-edit
            cargo-watch
            cargo
            rustc
            lld
            just
            wasm-pack
            wasm-bindgen-cli
            binaryen # provides wasm-opt, used by `wasm-pack build` (prod recipes)
            (pkgs.writeShellScriptBin "dev-build-canvas" ''cd "$(git rev-parse --show-toplevel)/renderer" && cargo watch -s "wasm-pack build --dev --no-pack --no-opt -t web songbook-render-canvas"'')
            (pkgs.writeShellScriptBin "dev-build-html" ''cd "$(git rev-parse --show-toplevel)/renderer" && cargo watch -s "wasm-pack build --dev --no-pack --no-opt -t web songbook-render-html"'')
          ];
          inputsFrom = [
            config.flake-root.devShell
          ];
          shellHook = ''
            # Register the checks as Git 2.54 config-based hooks (scoped to this
            # repo's local config). Multiple hooks run for the pre-commit event.
            ${lib.concatStringsSep "\n" (lib.mapAttrsToList (name: command: ''
              ${pkgs.git}/bin/git config --local hook.${name}.event pre-commit
              ${pkgs.git}/bin/git config --local hook.${name}.command "${command}"'')
            preCommitHooks)}
            ${pgEnv}
            export API_PROXY_TARGET="http://127.0.0.1:5512"
            # Point the Storybook Vitest project at the podman Playwright server
            # (`playwright-start`); run tests with `pnpm run test-storybook`.
            export PLAYWRIGHT_WS_ENDPOINT="${playwrightWsEndpoint}"
            menu
          '';
        };

        process-compose.default = {
          cli.options.keep-project = true;
          # Keep the HTTP/RPC server on (default) so agents can inspect process
          # state via `process-compose` client commands against a running instance.
          cli.options.no-server = false;
          cli.preHook = ''
            cd "$(${lib.getExe config.flake-root.package})"
          '';
          settings = {
            # The database connection is not configured globally: the socket
            # path depends on the checkout path, so processes that talk to
            # PostgreSQL set it up themselves (see pgEnv).
            environment = {
              PLAYWRIGHT_WS_ENDPOINT = playwrightWsEndpoint;
              API_PROXY_TARGET = "http://127.0.0.1:5512";
            };
            processes = {
              postgres = {
                command = ''
                  exec ${lib.getExe postgres}
                '';
                readiness_probe = {
                  exec.command = lib.getExe postgres-ready;
                  initial_delay_seconds = 2;
                  period_seconds = 2;
                  failure_threshold = 60;
                };
              };
              backend-install = {
                command = ''
                  ${pkgs.pnpm}/bin/pnpm i --frozen-lockfile
                '';
                working_dir = "backend";
              };
              backend = {
                command = ''
                  ${pgEnv}
                  ${pkgs.pnpm}/bin/pnpm node --watch src/index.ts
                '';
                working_dir = "backend";
                depends_on.backend-install.condition = "process_completed_successfully";
                depends_on.postgres.condition = "process_healthy";
                availability.restart = "on_failure";
              };
              frontend-install = {
                command = ''
                  ${pkgs.pnpm}/bin/pnpm i --frozen-lockfile
                '';
                working_dir = "frontend";
              };
              # Generate the typed API client from the backend OpenAPI spec. The
              # spec and derived types are gitignored, so a fresh checkout needs
              # this before the dev server can resolve them.
              frontend-gen-api = {
                command = ''
                  ${pgEnv}
                  ${pkgs.pnpm}/bin/pnpm run gen:api
                '';
                working_dir = "frontend";
                depends_on = {
                  frontend-install.condition = "process_completed_successfully";
                  backend-install.condition = "process_completed_successfully";
                };
              };
              # Builds the WASM PDF renderer the frontend imports from
              # frontend/src/wasm/ (see renderer/justfile's build-wasm-pdf recipe).
              # Run explicitly here with store paths rather than relying on
              # cargo/wasm-pack/just being on PATH, which only holds inside
              # `nix develop`, not for processes started by `nix run` - the
              # same way postgres/backend reference `${pkgs.pnpm}/bin/pnpm`.
              frontend-build-wasm-pdf = {
                command = ''
                  export PATH="${pkgs.cargo}/bin:${pkgs.rustc}/bin:${pkgs.lld}/bin:${pkgs.wasm-pack}/bin:${pkgs.wasm-bindgen-cli}/bin:${pkgs.binaryen}/bin:$PATH"
                  exec ${pkgs.cargo-watch}/bin/cargo-watch -w songbook-render-pdf -s "${pkgs.just}/bin/just build-wasm-pdf"
                '';
                working_dir = "renderer";
                # cargo-watch never exits, so downstream processes wait for the
                # first build to land the wasm output rather than for completion.
                readiness_probe = {
                  exec.command = "test -f ../frontend/src/wasm/songbook-render-pdf/songbook_render_pdf.js";
                  initial_delay_seconds = 1;
                  period_seconds = 2;
                  failure_threshold = 300;
                };
              };
              # Builds the WASM HTML renderer the frontend imports from
              # frontend/src/wasm/ (see renderer/justfile's build-wasm-html
              # recipe). Mirrors frontend-build-wasm-pdf above.
              frontend-build-wasm-html = {
                command = ''
                  export PATH="${pkgs.cargo}/bin:${pkgs.rustc}/bin:${pkgs.lld}/bin:${pkgs.wasm-pack}/bin:${pkgs.wasm-bindgen-cli}/bin:${pkgs.binaryen}/bin:$PATH"
                  exec ${pkgs.cargo-watch}/bin/cargo-watch -w songbook-render-html -s "${pkgs.just}/bin/just build-wasm-html"
                '';
                working_dir = "renderer";
                readiness_probe = {
                  exec.command = "test -f ../frontend/src/wasm/songbook-render-html/songbook_render_html.js";
                  initial_delay_seconds = 1;
                  period_seconds = 2;
                  failure_threshold = 300;
                };
              };
              frontend = {
                command = ''
                  ${pkgs.pnpm}/bin/pnpm run dev
                '';
                working_dir = "frontend";
                availability.restart = "on_failure";
                depends_on = {
                  frontend-gen-api.condition = "process_completed_successfully";
                  frontend-build-wasm-pdf.condition = "process_healthy";
                  frontend-build-wasm-html.condition = "process_healthy";
                };
              };
              frontend-types = {
                command = ''
                  ${pkgs.pnpm}/bin/pnpm run types --watch
                '';
                working_dir = "frontend";
                depends_on.frontend-install.condition = "process_completed_successfully";
              };
              storybook = {
                # --ci keeps Storybook from opening a browser tab on start.
                command = ''
                  ${pkgs.pnpm}/bin/pnpm run storybook --ci
                '';
                working_dir = "frontend";
                depends_on = {
                  frontend-gen-api.condition = "process_completed_successfully";
                  frontend-build-wasm-pdf.condition = "process_healthy";
                  frontend-build-wasm-html.condition = "process_healthy";
                };
              };
              # Runs the Storybook stories as Vitest browser tests against the
              # podman Playwright server. Disabled by default (it's a one-shot
              # check, not a long-running service); start it on demand from the
              # process-compose TUI or with
              # `process-compose run storybook-test`.
              storybook-test = {
                disabled = true;
                command = ''
                  ${playwrightPodman "-d"}
                  trap '${pkgs.podman}/bin/podman rm -f playwright-server' EXIT
                  ${pkgs.pnpm}/bin/pnpm run test-storybook
                '';
                working_dir = "frontend";
                availability.restart = "no";
                depends_on = {
                  frontend-gen-api.condition = "process_completed_successfully";
                  frontend-build-wasm-pdf.condition = "process_healthy";
                  frontend-build-wasm-html.condition = "process_healthy";
                };
              };
            };
          };
        };
      };
    };
}
