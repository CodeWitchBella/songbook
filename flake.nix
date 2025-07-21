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
          self',
          pkgs,
          system,
          ...
        }:
        let
          packageName = "songbook-renderer";
          buildTarget = "wasm32-wasip2";
          rustPkgs = import inputs.nixpkgs {
            inherit system;
            overlays = [ inputs.rust-overlay.overlays.default ];
          };
          rustToolchain = rustPkgs.rust-bin.stable.latest.default.override {
            targets = [ buildTarget ];
          };
          rustPlatform = rustPkgs.makeRustPlatform {
            cargo = rustToolchain;
            rustc = rustToolchain;
          };

        in
        {
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
              packages = with pkgs; [
                cargo
                cargo-edit
                cargo-watch
                cargo-mommy
                wasmtime
              ];
            };

          packages.wasm = rustPlatform.buildRustPackage {
            name = packageName;
            src = ./.;
            cargoLock.lockFile = ./Cargo.lock;

            buildPhase = ''
              cargo build --release -p ${packageName} --target=${buildTarget}
            '';

            installPhase = ''
              mkdir -p $out/lib
              cp target/${buildTarget}/release/*.wasm $out/lib/
            '';

            # Disable checks if they only work for WASM
            # doCheck = false;
          };
          packages.run = (pkgs.writeShellScriptBin "run" "wasmtime run --dir . ${self'.packages.wasm}/lib/${packageName}.wasm");

        };
    };
}
