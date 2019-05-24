import { DateTime } from 'luxon'

const enableLocalhostBackend = false
const url =
  window.location.hostname === 'localhost' && enableLocalhostBackend
    ? 'http://localhost:8080/graphql'
    : 'https://europe-west1-songbook-240720.cloudfunctions.net/graphql'

export function getGraphqlUrl() {
  return url
}

let promise = Promise.resolve(null as any)
export function graphqlFetch<V = any>({
  query,
  variables,
}: {
  query: string
  variables?: V
}) {
  const tmpe = new Error()
  const p = promise
    .catch(() => {})
    .then(async () => {
      const req = await fetch(url, {
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          operationName: null,
          variables,
          query,
        }),
        method: 'POST',
      })
      const json = await req.json()
      if (json.errors) {
        const error = new Error('Network error: Graphql request failed')
        ;(error as any).data = json
        error.stack = tmpe.stack
        throw error
      }
      return json
    })
  promise = p
  return p
}

export type User = {
  name: string
  picture: {
    url: string
    width: number
    height: number
  }
}

export const userFragment = `
  fragment user on User {
    name
    picture {
      url
      width
      height
    }
  }
`

export async function fbLogin(
  code: string,
  redirectUri: string,
): Promise<User> {
  return graphqlFetch({
    query: `
      mutation($code: String!, $redirectUri: String!) {
        fbLogin(code: $code, redirectUri: $redirectUri) {
          __typename
          ... on LoginError {
            message
          }
          ... on LoginSuccess {
            user {
              ...user
            }
          }
        }
      }
      ${userFragment}
    `,
    variables: { code, redirectUri },
  }).then(v => {
    if (v.data.fbLogin.__typename !== 'LoginSuccess') {
      console.log(v.data.fbLogin)
      throw new Error('Login failed')
    }
    return v.data.fbLogin.user
  })
}

export async function logout(): Promise<void> {
  return graphqlFetch({
    query: `mutation { logout }`,
  }).then(v => {
    if (!v.data.logout) {
      console.log(v.data.logout)
      throw new Error('Login failed')
    }
    return v.data.logout
  })
}
