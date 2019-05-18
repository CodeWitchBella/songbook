import { Firestore } from '@google-cloud/firestore'

const credentials = process.env.CREDENTIALS as any
export const firestore = new Firestore({
  credentials,
  projectId: credentials.project_id,
})
