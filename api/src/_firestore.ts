import { Firestore } from '@google-cloud/firestore'

const credentials = parseCredentials(process.env.FIREBASE_SERVICE_KEY || '{}')
export const firestore = new Firestore({
  credentials,
  projectId: credentials.project_id,
})

// this is here because now env pull performs weird mangling which I need to undo
function parseCredentials(creds: string) {
  if (creds.match(/^\{[ \n\t]*\\"/))
    creds = creds.replace(/\\"/g, '"').replace(/\n/g, '\\n')
  return JSON.parse(creds)
}
