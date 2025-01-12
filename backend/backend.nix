{pkgs, ...}: let
  # The path to the npm project
  src = ./.;

  # Read the package-lock.json as a Nix attrset
  packageLock = builtins.fromJSON (builtins.readFile (src + "/package-lock.json"));

  newPackageLock =
    packageLock
    // {
      packages = builtins.mapAttrs (name: value:
        value
        // (
          if name == ""
          then {}
          else {
            resolved = pkgs.fetchurl {
              url = value.resolved;
              hash = value.integrity;
            };
          }
        ))
      packageLock.packages;
    };

  pkgLockFile = pkgs.writeTextFile {
    name = "package-lock.json";
    text = builtins.toJSON newPackageLock;
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
      cp -r $src/package.json .
      cp -r ${pkgLockFile} package-lock.json

      npm ci
    '';

    installPhase = ''
      ln -s $out/js/node_modules/.bin $out/bin
    '';
  };

  songbook = pkgs.stdenv.mkDerivation {
    name = "songbook";
    version = "0.1.0";
    src = pkgs.lib.cleanSource ./.;
    buildInputs = [node_modules];

    buildPhase = ''
      mkdir -p $out/bin
      cp -r $src/. .
      ln -s ${node_modules}/js/node_modules node_modules
      ${pkgs.esbuild}/bin/esbuild src/index.ts --bundle --platform=neutral --sourcemap --outfile=$out/bundle.mjs --format=esm --main-fields=main,module --banner:js="import{Buffer}from'node:buffer';globalThis.Buffer = Buffer;import process from'node:process';globalThis.process = process;" --external:os --external:fs --external:net --external:stream --external:crypto --external:events --external:https --external:zlib --external:url --external:punycode --external:http --external:perf_hooks --external:tls
    '';
    installPhase = ''
      echo "#!${pkgs.bash}/bin/bash" > $out/bin/songbook-backend
      echo "cd $out" >> $out/bin/songbook-backend
      echo "${pkgs.deno}/bin/deno run -A --unstable-bare-node-builtins $out/bundle.mjs" >> $out/bin/songbook-backend
      chmod +x $out/bin/songbook-backend
    '';
  };
in {
  packages = {
    inherit node_modules songbook;
    default = songbook;
  };
}
