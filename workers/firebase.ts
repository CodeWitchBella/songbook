import { backup, initializeFirebaseApp } from 'firestore-export-import'
import fs from 'fs'

import serviceAccount from './serviceAccountKey.json' assert { type: 'json' }

const firestore = initializeFirebaseApp(serviceAccount)

const songs = await backup(firestore, 'songs')
console.log(songs)
const deletedSongs = await backup(firestore, 'deletedSongs')
const sessions = await backup(firestore, 'sessions')
const collections = await backup(firestore, 'collections')
const users = await backup(firestore, 'users')
fs.writeFileSync(
  'export.json',
  JSON.stringify({ songs, deletedSongs, sessions, collections, users }),
  'utf-8',
)
