/* eslint-disable no-undef */
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { spawnSync } from 'child_process'
import fs from 'fs'

const dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const cmds = {
  init,
  start,
  stop,
  run,
  pull,
}

// eslint-disable-next-line no-undef
const cmd = process.argv[2]
if (!cmd) throw new Error('Missing command')
if (!cmds[cmd]) throw new Error(`Unknown command ${cmd}`)

process.chdir(dirname)

Promise.resolve()
  .then(cmds[cmd])
  .catch((err) => {
    console.error(err)
    stop()
    process.exit(1)
  })

async function init() {
  // Create a database with the data stored in the current directory
  runSync('initdb', ['-D', '.tmp/songbook', '--no-locale', '--encoding=UTF8'])

  start()

  // Create a database
  runSync('createdb', ['-h', path.join(dirname, '.tmp'), 'songbook'])

  runSync('bun', ['db-push'], path.join(dirname, 'workers'))

  //await restore()
  console.log('Skipping restore')

  stop()
}

function start() {
  // Start PostgreSQL running as the current user
  // and with the Unix socket in the current directory
  runSync('pg_ctl', [
    '-D',
    '.tmp/songbook',
    '-l',
    '.tmp/logfile',
    '-o',
    '--unix_socket_directories=' + path.join(dirname, '.tmp'),
    'start',
  ])
}

async function run() {
  if (!fs.existsSync(path.join(dirname, '.tmp/songbook'))) {
    await init()
  }
  // Start PostgreSQL running as the current user
  // and with the Unix socket in the current directory
  runSync('postgres', [
    '-D',
    '.tmp/songbook',
    '--unix_socket_directories=' + path.join(dirname, '.tmp'),
  ])
}

function stop() {
  runSync('pg_ctl', ['-D', '.tmp/songbook', 'stop'])
}

async function pull() {
  console.log('Pulling database data...')
  runSync('pg_dump', [
    await readDbUrl(),
    '--format=custom',
    '--file',
    path.join(dirname, '.tmp', 'prod.pgdump'),
    '--schema=public',
    '--no-owner',
  ])
}

async function restore() {
  const url = await readDbUrl()
  if (url) {
    if (!fs.existsSync(path.join(dirname, '.tmp', 'prod.pgdump'))) {
      await pull()
    }
  }
  console.log('Restoring database data...')
  runSync('pg_restore', [
    '--host=localhost',
    '--dbname=songbook',
    '--no-acl',
    '--no-owner',
    '--clean',
    '--if-exists',
    path.join(dirname, '.tmp', 'prod.pgdump'),
  ])
}

async function readDbUrl() {
  return (await import('dotenv')).parse(
    // run vercel pull to get this file
    fs.readFileSync('.env.local'),
  ).DATABASE_URL
}

function runSync(cmd, args, cwd = dirname) {
  console.log('Running', cmd)
  const res = spawnSync(cmd, args, { stdio: 'inherit', cwd })
  if (res.error) throw res.error
  if (res.status !== 0)
    throw new Error(`${cmd} exited with status ${res.status}`)
  if (res.signal) throw new Error(`Killed by signal ${res.signal}`)
  return res
}
