const fs = require('fs')
const child_process = require('child_process')
const path = require('path')

child_process.spawnSync(
  process.argv[0],
  [path.join(__dirname, 'node_modules', '.bin', 'i18next')],
  { cwd: __dirname, stdio: 'inherit' },
)

fix('./src/locales/translation-cs.json')
fix('./src/locales/translation-en.json')

function fix(fname) {
  fs.writeFileSync(fname, JSON.stringify(require(fname), null, 2) + '\n')
}
