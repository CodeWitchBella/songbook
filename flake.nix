{
  inputs = {
    flake-parts.url = "github:hercules-ci/flake-parts";
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    treefmt-nix.url = "github:numtide/treefmt-nix";
    treefmt-nix.inputs.nixpkgs.follows = "nixpkgs";
    make-shell.url = "github:nicknovitski/make-shell";
  };

  outputs = inputs @ {flake-parts, ...}: let
    flake = flake-parts.lib.mkFlake {inherit inputs;} {
      systems = inputs.nixpkgs.lib.systems.flakeExposed;
      imports = [
        inputs.treefmt-nix.flakeModule
        inputs.make-shell.flakeModules.default
      ];
      perSystem = {
        self',
        config,
        pkgs,
        system,
        ...
      }: {
        treefmt.config = {
          projectRootFile = "flake.nix";
          package = pkgs.treefmt;
          programs = {
            deadnix.enable = true;
            nixfmt.enable = true;
          };
        };

        make-shells.default = {...}: {
          env = {
            CARGO_MOMMYS_MOODS = "chill/ominous/thirsty/yikes";
          };
          packages = with pkgs; [
            cargo
            cargo-edit
            cargo-watch
            cargo-mommy
          ];
        };
      };
    };
  in
    flake;
}
