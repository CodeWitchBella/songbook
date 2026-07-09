{
  inputs = {
    flake-parts.url = "github:hercules-ci/flake-parts";
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    treefmt-nix.url = "github:numtide/treefmt-nix";
    treefmt-nix.inputs.nixpkgs.follows = "nixpkgs";
    make-shell.url = "github:nicknovitski/make-shell";
    rust-overlay.url = "github:oxalica/rust-overlay";
  };

  outputs =
    inputs@{ flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = inputs.nixpkgs.lib.systems.flakeExposed;
      imports = [
        inputs.treefmt-nix.flakeModule
        inputs.make-shell.flakeModules.default
      ];
      perSystem =
        {
          config,
          pkgs,
          system,
          lib,
          ...
        }:
        let
          treefmt-pre-commit = pkgs.writeShellApplication {
            name = "treefmt-pre-commit";
            runtimeInputs = [
              config.treefmt.build.wrapper
              pkgs.git
            ];
            text = ''
              files=$(git diff --cached --name-only --diff-filter=ACMR)
              [ -z "$files" ] && exit 0
              status=0
              # shellcheck disable=SC2086
              treefmt --no-cache $files || status=$?
              # shellcheck disable=SC2086
              if ! git diff --quiet -- $files; then
                echo "treefmt applied fixes (left unstaged); review and re-stage them." >&2
                status=1
              fi
              exit $status
            '';
          };

          cargo-fmt-pre-commit = pkgs.writeShellApplication {
            name = "cargo-fmt-pre-commit";
            runtimeInputs = [
              pkgs.git
              pkgs.cargo
              pkgs.rustc
            ];
            text = ''
              root=$(git rev-parse --show-toplevel)
              files=$(git -C "$root" diff --cached --name-only --diff-filter=ACMR -- '*.rs' '*Cargo.toml' '*Cargo.lock')
              [ -z "$files" ] && exit 0
              cd "$root"
              status=0
              cargo fmt --all || status=$?
              # shellcheck disable=SC2086
              if ! git diff --quiet -- $files; then
                echo "cargo fmt applied fixes (left unstaged); review and re-stage them." >&2
                status=1
              fi
              exit $status
            '';
          };

          cargo-check-pre-commit = pkgs.writeShellApplication {
            name = "cargo-check-pre-commit";
            runtimeInputs = [
              pkgs.git
              pkgs.cargo
              pkgs.rustc
            ];
            text = ''
              root=$(git rev-parse --show-toplevel)
              [ -z "$(git -C "$root" diff --cached --name-only --diff-filter=ACMR -- '*.rs' '*Cargo.toml' '*Cargo.lock')" ] && exit 0
              cd "$root"
              exec cargo check --all-targets
            '';
          };

          preCommitHooks = {
            treefmt = lib.getExe treefmt-pre-commit;
            cargo-fmt = lib.getExe cargo-fmt-pre-commit;
            cargo-check = lib.getExe cargo-check-pre-commit;
          };
        in
        {
          _module.args.pkgs = import inputs.nixpkgs {
            inherit system;
            overlays = [ inputs.rust-overlay.overlays.default ];
            config = { };
          };

          treefmt.config = {
            projectRootFile = "flake.nix";
            package = pkgs.treefmt;
            programs = {
              deadnix.enable = true;
              nixfmt.enable = true;
            };
          };

          make-shells.default =
            { ... }:
            {
              env = {
                CARGO_MOMMYS_MOODS = "chill/ominous/thirsty/yikes";
              };
              packages = (
                with pkgs;
                [
                  cargo-edit
                  cargo-watch
                  cargo-mommy
                  pnpm
                  nodejs
                  (pkgs.writeShellScriptBin "dev-build-canvas" ''cargo watch -s "wasm-pack build --dev --no-pack --no-opt -t web songbook-render-canvas"'')
                  (pkgs.writeShellScriptBin "dev-build-html" ''cargo watch -s "wasm-pack build --dev --no-pack --no-opt -t web songbook-render-html"'')
                  (pkgs.writeShellScriptBin "dev-serve" "pnpm exec vite")
                  wasm-pack
                  wasm-bindgen-cli
                  cargo
                  lld
                  rustc
                ]
              );
              shellHook = ''
                ${lib.concatStringsSep "\n" (
                  lib.mapAttrsToList (name: command: ''
                    ${pkgs.git}/bin/git config --local hook.${name}.event pre-commit
                    ${pkgs.git}/bin/git config --local hook.${name}.command "${command}"'') preCommitHooks
                )}
              '';
            };
        };
    };
}
