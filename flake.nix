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
          pkgs,
          system,
          ...
        }:
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
                  (pkgs.writeShellScriptBin "dev-serve" ''pnpm exec vite'')
                  wasm-pack
                  wasm-bindgen-cli
                  cargo
                  lld
                  rustc
                ]
              );
            };
        };
    };
}
