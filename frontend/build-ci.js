const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const { spawnSync } = require("child_process");
if (process.env.LAST_MODIFIED) {
  patch(path.join("src", "build-data.tsx"), (content) => {
    return content
      .replace(/\$COMMIT_TIME_FROM_GIT/g, "true")
      .replace(
        /\$COMMIT_TIME/g,
        new Date(process.env.LAST_MODIFIED * 1000).toISOString(),
      );
  });
} else {
  getDate().then((date) => {
    patch(path.join("src", "build-data.tsx"), (content) => {
      if (date) {
        return content
          .replace(/\$COMMIT_TIME_FROM_GIT/g, "true")
          .replace(/\$COMMIT_TIME/g, date);
      } else {
        return content
          .replace(/\$COMMIT_TIME_FROM_GIT/g, "false")
          .replace(/\$COMMIT_TIME/g, new Date().toISOString());
      }
    });
  });
}

function getDate() {
  const commitSha = spawnSync("git", ["rev-parse", "HEAD"], {
    stdio: "pipe",
    encoding: "utf-8",
  }).stdout;
  const commitRepo = "songbook";
  const commitOrg = "CodeWitchBella";
  if (commitSha && commitRepo && commitOrg) {
    const url = `https://api.github.com/repos/${commitOrg}/${commitRepo}/commits/${commitSha}`;
    console.log(url);
    return fetch(url)
      .then((d) => d.json())
      .then((d) => {
        return d.commit.author.date;
      })
      .catch((e) => {
        console.error(e);
        return "";
      });
  } else {
    return Promise.resolve("");
  }
}

function patch(file, patcher) {
  const content = fs.readFileSync(path.join(__dirname, file), "utf8");
  const patched = patcher(content);
  fs.writeFileSync(path.join(__dirname, file), patched, "utf8");
}
