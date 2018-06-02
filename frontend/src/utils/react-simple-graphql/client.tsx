import React from 'react'
import createReactContext from 'utils/create-react-context'
// eslint-disable-next-line import/no-extraneous-dependencies
import { ApolloLink, Observable } from 'apollo-link'
import LiteEvent from './lite-event'

export const clientTag = Symbol('ClientTag')

export type QueryState = {
  event: LiteEvent<any>
  inFlight: boolean
  fetched: boolean
  refetchScheduled?: boolean
  data: any
  queryName: string
  refetch?: () => void
}
type Queries = {
  [key: string]: QueryState
}
export type Client = {
  [clientTag]: {
    link: ApolloLink

    queries: Queries
  }
  getCache: () => { [key: string]: any }
}
const Context = createReactContext(null as null | Client)

export const Provider: React.SFC<{ client: Client }> = ({
  client,
  children,
}) => {
  if (process.env.NODE_ENV !== 'production' && !client[clientTag]) {
    throw new Error('Prop client must be created with createClient')
  }
  return <Context.Provider value={client}>{children}</Context.Provider>
}
export const Consumer = Context.Consumer

export function createClient(opts: {
  link: ApolloLink
  cache?: { [key: string]: any }
}): Client {
  const cache = opts.cache || {}

  const queries: Queries = {}
  for (const key of Object.keys(cache)) {
    queries[key] = {
      data: cache[key],
      inFlight: false,
      event: new LiteEvent(),
      fetched: true,
      queryName: key.split('.')[0],
    }
  }

  return {
    [clientTag]: {
      link: opts.link,
      queries,
    },
    getCache: () => {
      const ret: { [key: string]: any } = {}
      for (const key of Object.keys(queries)) {
        ret[key] = queries[key].data
      }
      return ret
    },
  }
}
