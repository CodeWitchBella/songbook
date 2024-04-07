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
        yarnProject = pkgs.callPackage ./.yarn/yarn-project.nix {} {src = pkgs.lib.cleanSource ./.;};
        psql = pkgs.postgresql_16;

        clangPkgs = import nixpkgs {
          inherit system;
          replaceStdenv = {pkgs}: pkgs.clangStdenv;
        };

        pname = "winterjs";
        version = "1.1.0";
        wintersrc = clangPkgs.fetchFromGitHub {
          owner = "wasmerio";
          repo = pname;
          rev = "v${version}";
          hash = "sha256-C3YBguKEuRAeph93UV/l7wBoJr9QTXeSIg+RlbbXBL4=";
        };
        winterjs = with clangPkgs;
          rustPlatform.buildRustPackage {
            src = wintersrc;
            inherit pname version;
            cargoLock = {
              lockFile = "${wintersrc}/Cargo.lock";
              outputHashes = {
                "h2-0.3.23" = "sha256-6GxxC9hMAs/ZY3kPrkHk+OoefLs0DFcTPc3IdHKn5uM=";
                "hyper-0.14.28" = "sha256-6QYsZVmT3/RiR2gaiYaj6u0BDhuwu5JRaKpJDS+fp6E=";
                "hyper-rustls-0.25.0" = "sha256-29sHNTw/Rkt8mWJdVqWORJW/0u18sjb8RhW0nQ6QW3o=";
                "ion-0.1.0" = "sha256-DHZPe5RujzcuKbFH99Ls64NCh4pe4eQaGGhtFsYG5bQ=";
                "libc-0.2.139" = "sha256-W6zrItadLhN93U9yMndvHXioJKxjAV7FoR76/XLT4cI=";
                "libc-0.2.152" = "sha256-4XAe0aGythd9ig9D3R1L3XxhLmqIhEI170xBqLDkx7s=";
                "mio-0.8.9" = "sha256-8RXHAWlHA8c4PwQNH3XXbAWVzymQlC0JRDTj3wEaugA=";
                "mozjs-0.14.1" = "sha256-o9n9ezYa9WHsfRXPOr6sAbmOclML/xNuy1EZo5WguoM=";
                "ring-0.17.7" = "sha256-+QR5nlyJx1ySV6t9R8fu9dLoIq4L2bTarqilFtReuEs=";
                "rustls-0.22.2" = "sha256-2txtGrfvppvT27m+tn8ywJLduQGDxoG46mR4FGgQ4Jk=";
                "rustls-native-certs-0.6.3" = "sha256-Fm5RemTLlrZPDzzMvsLZaVmpqisiZ2y4bLCIPXSrnjk=";
                "rustls-webpki-0.102.1" = "sha256-+3Lruy8zElmu12rMrSDDxHEfcTjpE+Q1D9T90kpI7nw=";
                "sct-0.7.1" = "sha256-E0A2UN+h9ibbp7vwBN7hsUT6d+2iFCGMRJyZMbFABPA=";
                "signal-hook-registry-1.1.1" = "sha256-BkaWEuT0ASn12EEijR6uBC3glNMhG6zGJ0stbMrcbWI=";
                "socket2-0.5.5" = "sha256-IU2pNNmigB8YpOc0BYSUUvgww3wIfBLBBn6OCvhAdKA=";
                "static-web-server-2.14.2" = "sha256-pe8hOwkFSsMfN5YBKET/uCnmGNgv+0VNU4iXLpipfI0=";
                "tokio-1.35.1" = "sha256-z0uzxTs950tQhgK1Q7JlRFEE+NNOH7eWxlYblGezRSg=";
                "tokio-rustls-0.25.0" = "sha256-oZDDq92xDspq1vqMRkcpHbFjlKXUTXvkxZRyIIzw+rw=";
                "webpki-roots-0.25.2" = "sha256-hPVnf4MIGesK6e3kv1UdC72If/DFO/wLwMdSZK5ig1U=";
              };
            };
            cargoHash = "sha256-gsE9qHigEm5R1+lJU9uazWJ/8yZZjE0eVJDtZlX0SmM=";
            nativeBuildInputs = [clang pkg-config python3 gnum4 libllvm];
            buildInputs = [zlib llvmPackages.libclang];
            doCheck = false;
            buildPhase = ''
              export AS="$CC -c"
              export HOME=$TEMPDIR
              export LIBCLANG_PATH="${llvmPackages.libclang.lib}/lib"
              cargoBuildHook
            '';
          };
      in {
        treefmt.config = {
          projectRootFile = "flake.nix";
          package = pkgs.treefmt;
          programs = {
            alejandra.enable = true;
            deadnix.enable = true;
          };
        };

        devshells.default = {
          packages = with pkgs; [
            yarnProject
            yarnProject.yarn-freestanding
            mysql80
            zellij
            psql
            nodejs_20
            bun
            #wasmer
            #winterjs
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
              command = "yarn frontend:dev";
              help = "Start dev server for frontend code";
            }
            {
              name = "dev-proxy";
              command = "yarn frontend:proxy";
              help = "Start proxy to access production from frontend";
            }
            {
              name = "dev-frontend";
              command = "yarn frontend";
              help = "Start everything for frontend-only development";
            }
            {
              name = "dev-frontend-local";
              command = "yarn full:frontend";
              help = "Start frontend";
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
              command = "yarn full:db";
              help = "Start database";
            }
            {
              name = "db-push";
              command = "yarn workspace songbook-workers db-push";
              help = "Apply changes to database";
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
                ${psql}/bin/psql $URL $@
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

        packages.default = winterjs;

        process-compose = {};
      };
    };
}
