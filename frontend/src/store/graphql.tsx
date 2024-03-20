const url = '/api/graphql'

export function getGraphqlUrl() {
  if (typeof window === 'undefined')
    throw new Error('This is only available in browser')
  return new URL(url, window.location.toString()).toString()
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
  admin: boolean
  handle?: string
  picture: {
    url: string
    width: number
    height: number
  }
}

export const userFragment = `
  fragment user on User {
    name
    admin
    handle
    picture {
      url
      width
      height
    }
  }
`

export async function login(
  email: string,
  password: string,
): Promise<
  { type: 'success'; user: User } | { type: 'error'; message: string }
> {
  return graphqlFetch({
    query: `
      mutation($password: String!, $email: String!) {
        login(email: $email, password: $password) {
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
    variables: { email, password },
  }).then((v) => {
    if (v.data.login.__typename !== 'LoginSuccess') {
      console.log(v.data.login)
      return { type: 'error', message: v.data.login.message }
    }
    return { type: 'success', user: v.data.login.user }
  })
}

export async function register(
  email: string,
  password: string,
  name: string,
): Promise<
  { type: 'success'; user: User } | { type: 'error'; message: string }
> {
  return graphqlFetch({
    query: `
      mutation($input: RegisterInput!) {
        register(input: $input) {
          __typename
          ... on RegisterError {
            message
          }
          ... on RegisterSuccess {
            user {
              ...user
            }
          }
        }
      }
      ${userFragment}
    `,
    variables: { input: { email, password, name } },
  }).then((v) => {
    if (v.data.register.__typename !== 'RegisterSuccess') {
      console.log(v.data.register)
      return { type: 'error', message: v.data.register.message }
    }
    return { type: 'success', user: v.data.register.user }
  })
}

export async function logout(): Promise<void> {
  return graphqlFetch({
    query: `mutation { logout }`,
  }).then((v) => {
    if (!v.data.logout) {
      console.log(v.data.logout)
      throw new Error('Login failed')
    }
    return v.data.logout
  })
}
