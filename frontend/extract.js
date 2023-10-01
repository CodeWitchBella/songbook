const fs = require('fs')
const child_process = require('child_process')

child_process.spawnSync('i18next', {
  cwd: __dirname,
  stdio: 'inherit',
})

fix('./src/locales/translation-cs.json')
fix('./src/locales/translation-en.json')

function fix(fname) {
  fs.writeFileSync(fname, JSON.stringify(require(fname), null, 2) + '\n')
}
