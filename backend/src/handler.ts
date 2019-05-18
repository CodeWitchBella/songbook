import config from './server-config'
import { ApolloServer } from 'apollo-server-cloud-functions'
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
admin.initializeApp()

const server = new ApolloServer({ ...config, context: src => src })

const handler = server.createHandler({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:5000',
      'https://zpevnik.skorepova.info',
    ],
    credentials: true,
    maxAge: 3600,
  },
})

export const graphql = functions
  .region('europe-west1')
  .runWith({ memory: '128MB', timeoutSeconds: 30 })
  .https.onRequest((req: functions.https.Request, res: functions.Response) => {
    res.set('Access-Control-Allow-Credentials', 'true')

    return handler(
      new Proxy(req, {
        get(target, p) {
          if (p === 'path') return ''
          return (target as any)[p]
        },
      }),
      res,
    )
  })
