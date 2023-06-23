{
  description = "Gemma";

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
    nix-filter.url = "github:numtide/nix-filter";
  };

  outputs = { self, flake-utils, devshell, nixpkgs, nix-filter, ... }:
    flake-utils.lib.eachDefaultSystem (system: {
      devShell = let
        pkgs = import nixpkgs {
          inherit system;

          overlays = [ devshell.overlays.default ];
        };
        nodejs = pkgs.nodejs_20;
        packageJson = builtins.fromJSON (builtins.readFile ./package.json);
        corepack = pkgs.stdenv.mkDerivation {
          name = "corepack-shims";
          nativeBuildInputs = [ nodejs ];
          phases = [ "installPhase" ];
          installPhase = ''
            mkdir -p $out/bin
            HOME=$PWD
            echo '{ "packageManager": "${packageJson.packageManager}" }' > package.json
            corepack prepare
            corepack enable --install-directory=$out/bin
          '';
        };
      in pkgs.devshell.mkShell {
        imports = [ (pkgs.devshell.importTOML ./devshell.toml) ];
        devshell.packages = [ nodejs corepack ];
      };
    });
}