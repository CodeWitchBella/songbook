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
    };
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
      inputs.flake-utils.follows = "flake-utils";
    };
  };

  outputs = {
    self,
    flake-utils,
    devshell,
    nixpkgs,
    rust-overlay,
    ...
  }:
    flake-utils.lib.eachDefaultSystem (system: {
      devShell = let
        pkgs = import nixpkgs {
          inherit system;

          overlays = [
            (import rust-overlay)
            devshell.overlays.default
          ];
        };
        yarnProject = pkgs.callPackage ./.yarn/yarn-project.nix {} {src = pkgs.lib.cleanSource ./.;};
      in
        pkgs.devshell.mkShell {
          imports = [(pkgs.devshell.importTOML ./devshell.toml)];
          devshell.packages = with pkgs; [
            nodejs_20
            nodePackages.wrangler
            openssl
            (rust-bin.fromRustupToolchainFile ./rust/rust-toolchain.toml)
            #yarn-berry
            yarnProject
          ];
        };
    });
}
