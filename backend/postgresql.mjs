/* eslint-disable no-undef */
import path from "node:path";
import { fileURLToPath } from "node:url";

import { spawnSync } from "child_process";
import fs from "fs";

// The local database server itself is run by podman via the `postgres`,
// `postgres-start` and `postgres-stop` commands from the dev shell (see
// flake.nix). This script only deals with prod data: `pull` dumps it and
// `restore` loads that dump into the local database (POSTGRESQL_URL).
const dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const cmds = {
  pull,
  restore,
};

const cmd = process.argv[2];
if (!cmd) throw new Error("Missing command");
if (!cmds[cmd]) throw new Error(`Unknown command ${cmd}`);

process.chdir(dirname);

Promise.resolve()
  .then(cmds[cmd])
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

async function pull() {
  console.log("Pulling database data...");
  runSync("pg_dump", [
    await readDbUrl(),
    "--format=custom",
    "--file",
    path.join(dirname, ".tmp", "prod.pgdump"),
    "--schema=public",
    "--no-owner",
  ]);
}

async function restore() {
  if (!fs.existsSync(path.join(dirname, ".tmp", "prod.pgdump"))) {
    await pull();
  }
  const url = process.env.POSTGRESQL_URL;
  if (!url) throw new Error("Missing POSTGRESQL_URL env");
  console.log("Restoring database data...");
  runSync("pg_restore", [
    `--dbname=${url}`,
    "--no-acl",
    "--no-owner",
    "--clean",
    "--if-exists",
    path.join(dirname, ".tmp", "prod.pgdump"),
  ]);
}

async function readDbUrl() {
  return (await import("dotenv")).parse(
    // run vercel pull to get this file
    fs.readFileSync(".env.local"),
  ).DATABASE_URL;
}

function runSync(cmd, args, cwd = dirname) {
  console.log("Running", cmd);
  const res = spawnSync(cmd, args, { stdio: "inherit", cwd });
  if (res.error) throw res.error;
  if (res.status !== 0) throw new Error(`${cmd} exited with status ${res.status}`);
  if (res.signal) throw new Error(`Killed by signal ${res.signal}`);
  return res;
}
