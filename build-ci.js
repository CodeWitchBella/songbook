const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')

function patch(file, patcher) {
  const content = fs.readFileSync(path.join(__dirname, file), 'utf8')
  const patched = patcher(content)
  fs.writeFileSync(path.join(__dirname, file), patched, 'utf8')
}

const commitSha = process.env.VERCEL_GITHUB_COMMIT_SHA
const commitRepo = process.env.VERCEL_GITHUB_COMMIT_REPO
const commitOrg = process.env.VERCEL_GITHUB_COMMIT_ORG
if (commitSha && commitRepo && commitOrg) {
  const url = `https://api.github.com/repos/${commitOrg}/${commitRepo}/commits/${commitSha}`
  console.log(url)
  fetch(url)
    .then((d) => d.json())
    .then((d) => {
      return d.commit.author.date
    })
    .catch((e) => {
      console.error(e)
      return ''
    })
    .then((date) => {
      patch(path.join('src', 'build-data.tsx'), (content) =>
        content.replace(/\$COMMIT_TIME/g, date),
      )
    })
}
