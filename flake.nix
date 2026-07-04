{
  inputs = {
    flake-root.url = "github:srid/flake-root";
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-parts.url = "github:hercules-ci/flake-parts";
    make-shell.url = "github:nicknovitski/make-shell";
    process-compose-flake.url = "github:Platonic-Systems/process-compose-flake";
    treefmt-nix.url = "github:numtide/treefmt-nix";
    treefmt-nix.inputs.nixpkgs.follows = "nixpkgs";
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
        lib,
        ...
      }: let
        psql = pkgs.postgresql_18;

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

        # Custom pre-commit hook: format the staged files with treefmt and abort
        # the commit if anything was reformatted, so the fix has to be re-staged.
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

        # A pre-commit check that runs a pnpm-provided tool inside a workspace.
        # `scoped` tools (oxfmt/oxlint) only see the staged JS/TS files; others
        # (tsc) run project-wide but only when the workspace was touched.
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
                # shellcheck disable=SC2086
                exec pnpm exec ${tool} ${args} $files
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
            args = "--check";
            scoped = true;
          }
          {
            tool = "oxlint";
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
          {treefmt = lib.getExe treefmt-pre-commit;}
          // lib.listToAttrs (lib.concatMap (workspace:
            map (t:
              lib.nameValuePair "${workspace}-${t.tool}"
              (lib.getExe (mkWorkspaceHook workspace t)))
            (workspaceTools workspace))
          ["frontend" "backend"]);
      in {
        treefmt.config = {
          projectRootFile = "flake.nix";
          package = pkgs.treefmt;
          programs = {
            alejandra.enable = true;
            deadnix.enable = true;
          };
        };

        make-shells.default = {
          packages = [
            psql
            pkgs.git # >= 2.54, for config-based hooks (hook.<name>.event/command)
            pkgs.pnpm
            pkgs.nodejs_26
            playwright
            playwright-start
            playwright-stop
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
            export PGHOST="$(${lib.getExe config.flake-root.package})/.tmp"
            export PGDATABASE="songbook"
            export POSTGRESQL_URL="postgresql://localhost/songbook?host=$PGHOST"
            export API_PROXY_TARGET="http://127.0.0.1:5512"
            # Point the Storybook Vitest project at the podman Playwright server
            # (`playwright-start`); run tests with `pnpm run test-storybook`.
            export PLAYWRIGHT_WS_ENDPOINT="${playwrightWsEndpoint}"
            menu
          '';
        };

        process-compose.default = {
          cli.options.keep-project = true;
          cli.options.no-server = true;
          cli.preHook = ''
            cd "$(${lib.getExe config.flake-root.package})"
          '';
          settings = {
            environment = {
              POSTGRESQL_URL = "postgresql://localhost/songbook";
              PLAYWRIGHT_WS_ENDPOINT = playwrightWsEndpoint;
              API_PROXY_TARGET = "http://127.0.0.1:5512";
            };
            processes = {
              postgres.command = ''
                cd backend
                ${pkgs.pnpm}/bin/pnpm node postgresql.mjs run
              '';
              backend-install = {
                command = ''
                  ${pkgs.pnpm}/bin/pnpm i --frozen-lockfile
                '';
                working_dir = "backend";
              };
              backend = {
                command = ''
                  ${pkgs.pnpm}/bin/pnpm node --watch src/index.ts
                '';
                working_dir = "backend";
                depends_on.backend-install.condition = "process_completed_successfully";
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
                  ${pkgs.pnpm}/bin/pnpm run gen:api
                '';
                working_dir = "frontend";
                depends_on = {
                  frontend-install.condition = "process_completed_successfully";
                  backend-install.condition = "process_completed_successfully";
                };
              };
              frontend = {
                command = ''
                  ${pkgs.pnpm}/bin/pnpm run dev
                '';
                working_dir = "frontend";
                depends_on.frontend-gen-api.condition = "process_completed_successfully";
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
                depends_on.frontend-gen-api.condition = "process_completed_successfully";
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
                depends_on.frontend-gen-api.condition = "process_completed_successfully";
              };
            };
          };
        };
      };
    };
}
