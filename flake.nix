{
  inputs = {
    flake-parts.url = "github:hercules-ci/flake-parts";
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    systems.url = "github:nix-systems/default";
    treefmt-nix.url = "github:numtide/treefmt-nix";
    treefmt-nix.inputs.nixpkgs.follows = "nixpkgs";
    process-compose-flake.url = "github:Platonic-Systems/process-compose-flake";
    devshell.url = "github:numtide/devshell";
    devshell.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs = inputs @ {
    flake-parts,
    nixpkgs,
    ...
  }:
    flake-parts.lib.mkFlake {inherit inputs;} {
      systems = ["x86_64-linux" "aarch64-linux"];
      imports = [
        inputs.treefmt-nix.flakeModule
        inputs.process-compose-flake.flakeModule
        inputs.devshell.flakeModule
      ];
      perSystem = {
        config,
        pkgs,
        system,
        ...
      }: let
        psql = pkgs.postgresql_16;

        frontend = import ./frontend/frontend.nix {inherit inputs pkgs;};
      in {
        treefmt.config = {
          projectRootFile = "flake.nix";
          package = pkgs.treefmt;
          programs = {
            alejandra.enable = true;
            deadnix.enable = true;
            biome = {
              enable = true;
              settings.javascript.formatter = {
                quoteStyle = "single";
                semicolons = "asNeeded";
                indentStyle = "space";
              };
              settings.json.formatter = {
                indentStyle = "space";
              };
            };
          };
        };

        devshells.default = {
          packages = with pkgs; [
            zellij
            psql
            nodejs_20
            bun
          ];
          commands = let
            cd = ''
              set -e
              pushd .
              while true; do
                if [ "$PWD" = "/" ]; then
                  echo "Can't find project \$ROOT"
                  exit 1
                elif [ -f flake.nix ]; then
                  break
                fi
                cd ..
              done
            '';
          in [
            {
              name = "dev-frontend-vite";
              command = ''
                ${cd}
                cd frontend
                npm run dev
              '';
              help = "Start dev server for frontend code";
            }
            {
              name = "dev-server";
              command = ''
                ${cd}
                bun --watch workers/src/index.ts
              '';
              help = "Start dev server for backend code";
            }
            {
              name = "dev-db";
              command = "node workers/postgresql.mjs run";
              help = "Start database";
            }
            {
              name = "dev";
              command = ''
                ${cd}
                ${pkgs.zellij}/bin/zellij --layout zellij-layout.kdl
              '';
              help = "Start everything needed for fullstack development";
            }
            {
              name = "psql-local";
              command = ''
                ${cd}
                ${psql}/bin/psql $POSTGRESQL_URL $@
              '';
            }
          ];
          env = [
            {
              name = "POSTGRESQL_URL";
              value = "postgresql://localhost/songbook";
            }
          ];
        };

        packages.default = frontend.packages.default;

        process-compose = {};
      };
    };
}
