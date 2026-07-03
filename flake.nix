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

        backend = import ./backend/backend.nix {inherit inputs pkgs;};
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
            pkgs.pnpm
            pkgs.nodejs_26
          ];
          inputsFrom = [
            config.flake-root.devShell
          ];
          shellHook = ''
            export PGHOST="$(${lib.getExe config.flake-root.package})/.tmp"
            export PGDATABASE="songbook"
            export POSTGRESQL_URL="postgresql://localhost/songbook?host=$PGHOST"
            menu
          '';
        };

        packages.backend = backend.packages.default;
        packages.docker = backend.packages.docker;

        process-compose.default = {
          cli.options.keep-project = true;
          cli.options.no-server = true;
          cli.preHook = ''
            cd "$(${lib.getExe config.flake-root.package})"
          '';
          settings = {
            environment = {
              POSTGRESQL_URL = "postgresql://localhost/songbook";
            };
            processes = {
              postgres.command = ''
                cd backend
                ${pkgs.pnpm}/bin/pnpm node postgresql.mjs run
              '';
              backend = {
                command = ''
                  ${pkgs.pnpm}/bin/pnpm i --frozen-lockfile
                  ${pkgs.pnpm}/bin/pnpm node --watch src/index.ts
                '';
                working_dir = "backend";
              };
              frontend-install = {
                command = ''
                  ${pkgs.pnpm}/bin/pnpm i --frozen-lockfile
                '';
                working_dir = "frontend";
              };
              frontend = {
                command = ''
                  ${pkgs.pnpm}/bin/pnpm run dev
                '';
                working_dir = "frontend";
                depends_on.frontend-install.condition = "process_completed_successfully";
              };
              frontend-types = {
                command = ''
                  ${pkgs.pnpm}/bin/pnpm run types --watch
                '';
                working_dir = "frontend";
                depends_on.frontend-install.condition = "process_completed_successfully";
              };
            };
          };
        };
      };
    };
}
