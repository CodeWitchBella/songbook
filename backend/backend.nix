{pkgs, ...}: let
  run = pkgs.writeShellScript "songbook-backend" ''
    ${pkgs.bun}/bin/bun workers/src/index.ts
  '';
  songbook = pkgs.stdenv.mkDerivation {
    name = "songbook";
    version = "0.1.0";
    src = pkgs.lib.cleanSource ./.;
    buildInputs = [pkgs.bun];

    buildPhase = ''
      mkdir -p $out/js $out/bin
      cd $out/js
      cp -r $src/. .
    '';
    installPhase = ''
      echo "#!${pkgs.bash}/bin/bash" > $out/bin/songbook-backend
      echo "cd $out/js" >> $out/bin/songbook-backend
      echo "${pkgs.bun}/bin/bun src/index.ts" >> $out/bin/songbook-backend
      chmod +x $out/bin/songbook-backend
    '';
  };
in {
  packages = {
    inherit songbook;
    default = songbook;
  };
}
