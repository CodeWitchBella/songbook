import serverConfig from './src/_server-config'
import { ApolloServer } from 'apollo-server-lambda'
import type {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  Context as APIGatewayProxyContext,
  APIGatewayProxyResult,
} from 'aws-lambda'
import type { MyContext } from './src/_context'
import type { Duration } from 'luxon'
import { parseSessionCookie, createSetSessionCookieHeader } from './src/_cookie'

export const config = {
  api: {
    bodyParser: false,
  },
}

export const handler: APIGatewayProxyHandler = (event, context, callback) => {
  let newSessionCookie: {
    cookie: string | null
    duration: Duration
  } | null = null

  const server = new ApolloServer({
    ...serverConfig,
    context: ({
      event,
      context,
    }: {
      event: APIGatewayProxyEvent
      context: APIGatewayProxyContext
    }): MyContext => ({
      setSessionCookie(cookie, duration) {
        newSessionCookie = { cookie, duration }
      },
      sessionCookie: parseSessionCookie(event.headers['cookie']),
    }),
    playground: {
      endpoint: '/api/graphql',
    },
  })

  const gql = server.createHandler()

  function respondError(code: number, body: string) {
    callback(null, {
      statusCode: code,
      body,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  }
  const originConfig = {
    currentOrigin: getFirst(event.headers.origin) || '',
    deploymentUrl: process.env.VERCEL_URL,
  }
  if (event.httpMethod !== 'GET' && !correctOrigin(originConfig)) {
    return respondError(
      403,
      'Forbidden, wrong origin. Got: ' +
        originConfig.currentOrigin +
        '\nExpected one of:\n' +
        allowedOrigins(originConfig),
    )
  }
  try {
    if (
      event.httpMethod === 'POST' &&
      event.headers['content-type'] !== 'application/json'
    )
      return respondError(403, 'Expected application/json content-type')
    if (event.isBase64Encoded) {
      event.body = Buffer.from(event.body || '', 'base64').toString('utf8')
    }
    return gql(
      event,
      context,
      (
        error?: string | Error | null | undefined,
        result?: APIGatewayProxyResult | undefined,
      ) => {
        if (!result) return callback(error, result)
        if (!newSessionCookie) return callback(error, result)

        const [header, value] = createSetSessionCookieHeader(
          newSessionCookie.cookie,
          newSessionCookie.duration,
        )

        callback(error, {
          ...result,
          headers: {
            ...result?.headers,
            [header]: value,
          },
        })
      },
    )
  } catch (e) {
    return respondError(500, e.stack)
  }
}

function allowedOrigins({ deploymentUrl }: { deploymentUrl?: string }) {
  let ret = `https://zpevnik.skorepova.info
  https://songbook.now.sh
  http://localhost:3000
  https://songbook.codewitchbella.now.sh
  https://songbook-*.codewitchbella.now.sh`.replace(/\n +/g, '\n')
  if (deploymentUrl) {
    ret += `\nhttps://${deploymentUrl}`
  }
  return ret
}

function correctOrigin({
  currentOrigin,
  deploymentUrl,
}: {
  currentOrigin: string
  deploymentUrl?: string
}) {
  if (currentOrigin === 'https://zpevnik.skorepova.info') return true
  if (currentOrigin === 'https://songbook.now.sh') return true
  if (currentOrigin === 'http://localhost:3000') return true
  if (deploymentUrl && currentOrigin === 'https://' + deploymentUrl) return true
  if (
    /^https:\/\/songbook(-[a-z-]+)?\.codewitchbella\.now\.sh$/.exec(
      currentOrigin,
    )
  )
    return true
  return false
}

function getFirst<T>(o: undefined | T | T[]): T | undefined {
  if (Array.isArray(o)) return o[0]
  return o
}
