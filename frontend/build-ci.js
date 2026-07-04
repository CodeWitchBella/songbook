const fs = require("fs");
const path = require("path");

const commitTime = process.env.LAST_MODIFIED
  ? new Date(process.env.LAST_MODIFIED * 1000).toISOString()
  : new Date().toISOString();
const fromGit = process.env.LAST_MODIFIED ? "true" : "false";

patch(path.join("src", "build-data.tsx"), content =>
  content.replace(/\$COMMIT_TIME_FROM_GIT/g, fromGit).replace(/\$COMMIT_TIME/g, commitTime),
);

function patch(file, patcher) {
  const content = fs.readFileSync(path.join(__dirname, file), "utf8");
  fs.writeFileSync(path.join(__dirname, file), patcher(content), "utf8");
}
