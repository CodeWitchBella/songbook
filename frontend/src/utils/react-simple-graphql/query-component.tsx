import React from 'react'
import { DocumentNode, GraphQLError } from 'graphql'
// eslint-disable-next-line import/no-extraneous-dependencies
import { ApolloLink, Observable } from 'apollo-link'
import stableStringify from 'json-stable-stringify'
import { Consumer, Client, clientTag, QueryState } from './client'
import LiteEvent, { Subscription } from './lite-event'
import { hashString } from './hash-string'

type Fetcher = {
  query: () => void
}
type ComponentProps<T> = T & { fetcher: Fetcher }

type QueryResult<Result> = {
  errors?: ReadonlyArray<GraphQLError>
  data?: Result
}

type Props<Result, Variables> = {
  variables: Variables
  children: (result: QueryResult<Result>) => React.ReactNode
  client: Client
  query: DocumentNode
  operationName: string
  operationKey: string
  placeholder?: () => React.ReactNode
}

type State<Result> = {
  fetched: boolean
  data: QueryResult<Result> | null
  key: string
}

function doQuery(
  args: {
    link: ApolloLink
    state: QueryState
    operationName: string
    operationKey: string
  },
  opts: { query: DocumentNode; variables: any },
) {
  const { state, link, operationName, operationKey } = args
  const context = {}
  const observable = link.request({
    ...opts,
    extensions: {},
    getContext: () => context,
    operationName,
    setContext(patch) {
      return Object.assign(context, patch)
    },
    toKey: () => operationKey,
  })

  const onValue = (v: any) => {
    state.inFlight = false
    state.fetched = true
    state.data = v
    state.event.trigger(v)
  }

  if (!observable) {
    onValue(null)
  } else {
    state.inFlight = true
    const handle = observable.subscribe(v => {
      handle.unsubscribe()
      onValue(v)
    })
  }
}

class QueryImpl<Result, Variables> extends React.Component<
  Props<Result, Variables>,
  State<Result>
> {
  state: State<Result>
  subscription: Subscription | null = null

  constructor(props: Props<Result, Variables>, context?: any) {
    super(props, context)
    this.subscribe()
    this.state = QueryImpl.getDerivedStateFromProps(props, null) as any
  }

  subscribe = () => {
    if (this.subscription) {
      return
    }
    const pr = this.props.client[clientTag]
    const key = this.props.operationKey

    if (key in pr.queries) {
      const state = pr.queries[key]
      this.subscription = state.event.subscribe(v => {
        this.setState({ fetched: true, data: v })
      })
    }
  }

  render() {
    const pr = this.props.client[clientTag]
    const key = this.props.operationKey
    if (!this.state.fetched) {
      const promise = this.fetchData()
      if (this.props.placeholder) {
        return this.props.placeholder()
      }
      throw promise
    }

    return this.props.children(this.state.data || {})
  }

  componentWillUnmount() {
    if (this.subscription !== null) {
      this.subscription.unsubscribe()
    }
  }

  componentDidUpdate(
    prevProps: Props<Result, Variables>,
    prevState: State<Result>,
  ) {
    if (prevProps.operationKey !== this.props.operationKey) {
      if (this.subscription) {
        this.subscription.unsubscribe()
        this.subscription = null
      }
      this.fetchData()
    }
  }

  fetchData(): Promise<void> {
    return new Promise(resolve => {
      if (this.state.fetched) {
        resolve()
        return
      }

      const pr = this.props.client[clientTag]
      const key = this.props.operationKey

      if (!(key in pr.queries)) {
        pr.queries[key] = {
          event: new LiteEvent(),
          fetched: false,
          inFlight: false,
          data: null,
          queryName: this.props.operationName,
        }
      }

      const state = pr.queries[key]
      if (!state.refetch) {
        state.refetch = () =>
          doQuery(
            {
              link: pr.link,
              state,
              operationName: this.props.operationName,
              operationKey: this.props.operationKey,
            },
            {
              variables: (this.props as any).variables || {},
              query: this.props.query,
            },
          )
      }

      this.subscribe()

      const resolveSubscription = state.event.subscribe(v => {
        resolveSubscription.unsubscribe()
        resolve()
      })

      if ((!state.fetched || state.refetchScheduled) && !state.inFlight) {
        state.refetch()
      }
    })
  }
  static getDerivedStateFromProps(
    nextProps: Props<any, any>,
    prevState: State<any> | null,
  ): State<any> | null {
    if (prevState && prevState.key === nextProps.operationKey) {
      return null
    }

    const pr = nextProps.client[clientTag]
    const key = nextProps.operationKey

    if (key in pr.queries) {
      const state = pr.queries[key]
      if (state.fetched) {
        return {
          fetched: true,
          data: state.data,
          key,
        }
      }
    }

    return {
      fetched: false,
      data: null,
      key,
    }
  }
}

export type Query<Result, Variables = undefined> = React.SFC<
  (Variables extends undefined
    ? { variables?: undefined }
    : {
        variables: Variables
      }) & {
    children: (result: QueryResult<Result>) => React.ReactNode
    // placeholder is only temporarily mandatory - will be optional once
    // suspense is fully usable
    placeholder: () => React.ReactNode
  }
>

export const query = <Result, Variables = undefined>(
  q: DocumentNode,
): Query<Result, Variables> => {
  const def = q.definitions[0]
  if (def.kind !== 'OperationDefinition')
    throw new Error('Query must have operation definition')
  if (def.operation !== 'query') throw new Error('Operation must be query')
  const operationName = def.name
  if (!operationName) throw new Error('Query must have name')

  return props => (
    <Consumer>
      {client => {
        if (!client) {
          throw new Error('Query component must be under <Provider>')
        }

        const variables = props.variables
        const operationKey =
          variables === undefined
            ? ''
            : `.${hashString(stableStringify({ variables }))}`

        return (
          <QueryImpl
            client={client}
            query={q}
            variables={variables}
            operationName={operationName.value}
            operationKey={operationName.value + operationKey}
            placeholder={props.placeholder}
          >
            {props.children}
          </QueryImpl>
        )
      }}
    </Consumer>
  )
}

export function isQueryComponent(a: any) {
  return a instanceof QueryImpl
}
