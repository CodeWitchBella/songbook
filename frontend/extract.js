const child_process = require("child_process");

child_process.spawnSync("i18next-cli", ["extract"], {
  cwd: __dirname,
  stdio: "inherit",
});
