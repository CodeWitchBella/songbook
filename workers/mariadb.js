import { spawn, spawnSync } from 'child_process'
import fs, { mkdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const dir = fileURLToPath(new URL('./.mariadb', import.meta.url))
const sock = path.join(dir, 'mariadb.sock')
const datadir = path.join(dir, 'data')

const opts = [
  '--no-defaults', // prevent files in home directory from interfering
  '--gdb', // enables ctrl-c to exit
  '--datadir',
  datadir,
  '--socket',
  sock,
]

if (!fs.existsSync(datadir)) {
  mkdirSync(datadir, { recursive: true })
  runSync(['mariadb-install-db', '--no-defaults', `--datadir=${datadir}`])
  const mariadb = spawn('mariadbd', opts, { stdio: 'pipe' })
  mariadb.stderr.setEncoding('utf-8')
  await new Promise((res) => {
    let text = ''
    mariadb.stderr.on('data', (data) => {
      text += data
      if (text.includes('mariadbd: ready for connections')) res()
    })
  })
  await new Promise((res) => setTimeout(res, 5000))
  const client = spawn('mariadb', ['-S', sock], {
    stdio: ['pipe', 'inherit', 'inherit'],
  })
  client.stdin.write(`
    CREATE DATABASE \`database\`;
    DROP USER IF EXISTS ''@'localhost';
    CREATE USER user@'%' IDENTIFIED BY 'password';
    grant all privileges on *.* to user@'%' identified by 'password' with grant option;
  `)
  client.stdin.end()
  await new Promise((res) => client.once('close', res))
  mariadb.kill('SIGINT')
  await new Promise((res) => mariadb.once('close', res))
}

runSync(['mariadbd', opts], { stdio: 'inherit' })

function runSync(args, opts) {
  args = args.flat().filter(Boolean)
  const out = spawnSync(args[0], args.slice(1), opts)
  if (out.status !== 0)
    throw new Error('Process exited with status ' + out.status)
}
