import { spawn, spawnSync } from "child_process";
import fs, { mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dir = fileURLToPath(new URL("./.mysql", import.meta.url));
const sock = path.join(dir, "mysql.sock");
const datadir = path.join(dir, "data");

const opts = [
  "--no-defaults", // prevent files in home directory from interfering
  "--gdb", // enables ctrl-c to exit
  "--datadir",
  datadir,
  "--socket",
  sock,
  "--bind-address",
  "localhost",
  "--mysqlx=OFF",
];

if (!fs.existsSync(datadir)) {
  mkdirSync(datadir, { recursive: true });
  runSync([
    "mysqld",
    "--initialize-insecure",
    "--user=user",
    `--datadir=${datadir}`,
  ]);
  const mysql = spawn("mysqld", opts, { stdio: "pipe" });
  mysql.stderr.setEncoding("utf-8");
  await new Promise((res) => {
    let text = "";
    mysql.stderr.on("data", (data) => {
      text += data;
      if (text.includes("mysqld: ready for connections")) res();
    });
  });
  await new Promise((res) => setTimeout(res, 5000));
  const client = spawn("mysql", ["-S", sock, "-uroot"], {
    stdio: ["pipe", "inherit", "inherit"],
  });
  client.stdin.write(`
    CREATE DATABASE \`database\`;
    DROP USER IF EXISTS ''@'localhost';
    CREATE USER user@'%' IDENTIFIED BY 'password';
    grant all privileges on *.* to user@'%' identified by 'password' with grant option;
  `);
  client.stdin.end();
  await new Promise((res) => client.once("close", res));
  mysql.kill("SIGINT");
  await new Promise((res) => mysql.once("close", res));
}

runSync(["mysqld", opts], { stdio: "inherit" });

function runSync(args, opts) {
  args = args.flat().filter(Boolean);
  const out = spawnSync(args[0], args.slice(1), opts);
  if (out.status !== 0)
    throw new Error("Process exited with status " + out.status);
}
