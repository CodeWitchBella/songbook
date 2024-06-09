{
  inputs = {
    flake-parts.url = "github:hercules-ci/flake-parts";
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";
    systems.url = "github:nix-systems/default";
    treefmt-nix.url = "github:numtide/treefmt-nix";
    treefmt-nix.inputs.nixpkgs.follows = "nixpkgs";
    process-compose-flake.url = "github:Platonic-Systems/process-compose-flake";
    devshell.url = "github:numtide/devshell";
    devshell.inputs.nixpkgs.follows = "nixpkgs";
    project-root = {
      url = "file+file:///dev/null";
      flake = false;
    };
  };

  outputs = inputs @ {flake-parts, ...}:
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
        ...
      }: let
        root = builtins.readFile inputs.project-root.outPath;
        psql = pkgs.postgresql_16;
        nodejs = pkgs.nodejs_22;

        frontend = import ./frontend/frontend.nix {inherit inputs pkgs;};
        backend = import ./backend/backend.nix {inherit inputs pkgs;};
        backend-run = "${pkgs.deno}/bin/deno run --unstable-sloppy-imports --unstable-byonm -A";
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
                indentStyle = "space";
              };
              settings.json.formatter = {
                indentStyle = "space";
              };
            };
          };
        };

        devshells.default = {
          packages = [
            psql
            nodejs
            pkgs.bun
            pkgs.deno
          ];
          commands = [
            {
              name = "backend";
              command = ''
                cd ${root}/backend
                ${backend-run} src/index.ts
              '';
            }
            {
              name = "dev";
              command = ''
                cd ${root}
                nix run
              '';
              help = "Start everything needed for fullstack development";
            }
          ];
        };

        packages.frontend = frontend.packages.default {lastModified = builtins.toString inputs.self.lastModified;};
        packages.backend = backend.packages.default;

        process-compose.default.settings = {
          environment = {
            POSTGRESQL_URL = "postgresql://localhost/songbook";
          };
          processes = {
            postgres.command = "${pkgs.nodejs}/bin/node backend/postgresql.mjs run";
            backend = {
              command = "${backend-run} --watch src/index.ts";
              working_dir = "backend";
            };
            frontend = {
              command = "${nodejs}/bin/npm run dev";
              working_dir = "frontend";
            };
          };
        };
      };
    };
}
