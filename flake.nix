{
  description = "songbook";

  inputs = {
    systems.url = "github:nix-systems/default";
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils = {
      url = "github:numtide/flake-utils";
      inputs.systems.follows = "systems";
    };
    devshell = {
      url = "github:numtide/devshell";
      inputs.nixpkgs.follows = "nixpkgs";
      inputs.systems.follows = "systems";
    };
    corepack-overlay = {
      url = "github:CodeWitchBella/corepack-overlay/main";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
      inputs.flake-utils.follows = "flake-utils";
    };
  };

  outputs = { self, flake-utils, devshell, nixpkgs, corepack-overlay, rust-overlay, ... }:
    flake-utils.lib.eachDefaultSystem (system: {
      devShell = let
        pkgs = import nixpkgs {
          inherit system;

          overlays = [
            (import rust-overlay)
            (import corepack-overlay ./package.json)
            devshell.overlays.default
          ];
        };
      in pkgs.devshell.mkShell {
        imports = [ (pkgs.devshell.importTOML ./devshell.toml) ];
        devshell.packages = with pkgs; [
          nodejs_20
          corepack
          (rust-bin.fromRustupToolchainFile ./rust/rust-toolchain.toml)
          stdenv.cc
        ];
      };
    });
}
