{pkgs, ...}: let
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
    text = "${builtins.concatStringsSep "\n" tarballs}\n";
  };
  node_modules = pkgs.stdenv.mkDerivation {
    inherit (packageLock) name version;
    src = pkgs.lib.fileset.toSource {
      root = ./.;
      fileset = pkgs.lib.fileset.union ./package.json ./package-lock.json;
    };
    buildInputs = [pkgs.nodejs];
    buildPhase = ''
      set -xe
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
  songbook = {lastModified}:
    pkgs.stdenv.mkDerivation {
      name = "songbook";
      version = "0.1.0";
      src = pkgs.lib.cleanSource ./.;
      buildInputs = [pkgs.nodejs node_modules];

      buildPhase = ''
        export LAST_MODIFIED=${lastModified}
        cp -r ${node_modules}/js/node_modules .
        cp -r $src/. .
        npm run build-ci

        cp -r dist $out/
      '';
    };
in {
  packages = {
    inherit node_modules songbook;
    default = songbook;
  };
}
