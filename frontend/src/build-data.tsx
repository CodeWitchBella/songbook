export const buildData = {
  commitTime: "$COMMIT_TIME",
  commitSha: "$COMMIT_SHA",
  // @ts-ignore
  fallback: "$COMMIT_TIME_FROM_GIT" !== "true",
};
