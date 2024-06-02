{
  inputs,
  pkgs,
}: let
  # The path to the npm project
  src = ./.;

  # Read the package-lock.json as a Nix attrset
  packageLock = builtins.fromJSON (builtins.readFile (src + "/package-lock.json"));

  # Create an array of all (meaningful) dependencies
  deps =
    builtins.attrValues (removeAttrs packageLock.packages [""]);
  # Turn each dependency into a fetchurl call
  tarballs = map (p:
    pkgs.fetchurl {
      url = p.resolved;
      hash = p.integrity;
    })
  deps;

  # Write a file with the list of tarballs
  tarballsFile = pkgs.writeTextFile {
    name = "tarballs";
    text = builtins.concatStringsSep "\n" tarballs;
  };
  node_modules = pkgs.stdenv.mkDerivation {
    inherit (packageLock) name version;
    inherit src;
    buildInputs = [pkgs.nodejs];
    buildPhase = ''
      export HOME=$PWD/.home
      export npm_config_cache=$PWD/.npm
      mkdir -p $out/js
      cd $out/js
      cp -r $src/. .

      while read package
      do
        echo "caching $package"
        npm cache add "$package"
      done <${tarballsFile}

      npm ci
    '';

    installPhase = ''
      ln -s $out/js/node_modules/.bin $out/bin
    '';
  };
in {
  packages.default = node_modules;
}
