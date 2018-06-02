import fs from 'fs'
import path from 'path'

export const root = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf-8')
)

export const local = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
)
