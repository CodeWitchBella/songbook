const fs = require('fs')
const path = require('path')

patch(
  path.join(
    __dirname,
    '..',
    'node_modules',
    '@react-pdf',
    'unicode-properties',
    'package.json',
  ),
  (data) => {
    const v = JSON.parse(data)
    if (v['module'] === 'dist/unicode-properties.esm.js') return null
    if (
      v['module'] !== 'dist/unicode-properties.es.js' ||
      v['version'] !== '2.2.0'
    ) {
      console.log(v)
      throw new Error('Patch outdated')
    }
    v['module'] = 'dist/unicode-properties.esm.js'
    return JSON.stringify(v, null, 2)
  },
)

function patch(f, mod) {
  const content = fs.readFileSync(f, 'utf-8')
  const res = mod(content)
  if (res && content !== res) {
    fs.writeFileSync(f, res, 'utf-8')
  }
}
