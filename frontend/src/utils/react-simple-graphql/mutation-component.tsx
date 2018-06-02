import React from 'react'
import { DocumentNode, GraphQLError } from 'graphql'
import stableStringify from 'json-stable-stringify'
import { Raven } from 'utils/globals'
import { Consumer, Client, clientTag, QueryState } from './client'
import { hashString } from './hash-string'

type MutationResult<Result, UserError> = {
  errors?: ReadonlyArray<GraphQLError>
  data?: Result
  isMutating: boolean
  didMutate: boolean
  userErrors: UserError[] | false
  error: boolean
}

type MutateOpts<Result, UserError, ExtraData> = {
  onError?: (error?: any) => void
  onSuccess?: (
    result: MutationResult<Result, UserError>,
    client: Client,
  ) => void
} & (ExtraData extends undefined ? {} : { extra: ExtraData })

type Mutate<
  Result,
  Variables,
  UserError,
  ExtraData
> = ExtraData extends undefined
  ? (
      variables: Variables,
      opts?: MutateOpts<Result, UserError, ExtraData>,
    ) => void
  : (
      variables: Variables,
      opts: MutateOpts<Result, UserError, ExtraData>,
    ) => void

type Children<Result, Variables, UserError, ExtraData> = (
  args: {
    mutate: Mutate<Result, Variables, UserError, ExtraData>
  } & MutationResult<Result, UserError>,
) => React.ReactNode

type FactoryOpts<
  Result,
  Variables,
  UserError,
  ExtraData
> = UserError extends undefined
  ? {}
  : {
      checkInput?: (
        variables: Variables,
        extra: ExtraData,
      ) => true | UserError[]
      checkResult?: (
        result: {
          errors?: ReadonlyArray<GraphQLError>
          data?: Result
        },
      ) => true | UserError[]
    }

type Props<Result, Variables, UserError, ExtraData> = {
  children: Children<Result, Variables, UserError, ExtraData>
  client: Client
  mutation: DocumentNode
  operationKey: string
  operationName: string

  checkInput?: (variables: Variables, extra: ExtraData) => true | UserError[]
  checkResult?: (
    result: {
      errors?: ReadonlyArray<GraphQLError>
      data?: Result
    },
  ) => true | UserError[]
}

type State<Result, UserError> = MutationResult<Result, UserError>

class MutationImpl<
  Result,
  Variables,
  UserError,
  ExtraData
> extends React.Component<
  Props<Result, Variables, UserError, ExtraData>,
  State<Result, UserError>
> {
  state: State<Result, UserError> = {
    isMutating: false,
    didMutate: false,
    data: undefined,
    errors: undefined,
    userErrors: false,
    error: false,
  }

  checkResult(v: any, opts: MutateOpts<Result, UserError, ExtraData>): boolean {
    if (this.props.checkResult) {
      const res = this.props.checkResult({
        errors: v.errors,
        data: v.data as any,
      })

      if (res !== true) {
        if (opts.onError) opts.onError()
        this.setState({
          isMutating: false,
          didMutate: true,
          errors: v.errors,
          data: v.data as any,
          userErrors: res,
        })
        return true
      }
    }
    return false
  }

  mutate = (
    variables: Variables,
    opts: MutateOpts<Result, UserError, ExtraData> = {} as any,
  ): void => {
    if (this.props.checkInput) {
      const checkResult = this.props.checkInput(variables, (opts as any).extra)
      if (checkResult !== true) {
        this.setState({ userErrors: checkResult })
        return
      }
    }

    const { link } = this.props.client[clientTag]
    const context = {}
    const observable = link.request({
      extensions: {},
      getContext: () => context,
      setContext(patch) {
        return Object.assign(context, patch)
      },
      operationName: this.props.operationName,
      query: this.props.mutation,
      toKey: () => this.props.operationKey,
      variables,
    })
    if (!observable) {
      if (opts.onError) opts.onError()
      return
    }
    this.setState({ isMutating: true })
    observable.subscribe(
      v => {
        if (this.checkResult(v, opts)) return

        this.setState(
          {
            isMutating: false,
            didMutate: true,
            errors: v.errors,
            data: v.data as any,
            userErrors: false,
            error: false,
          },
          () => {
            if (opts.onSuccess) {
              opts.onSuccess(this.state, this.props.client)
            }
          },
        )
      },
      e => {
        this.setState({
          isMutating: false,
          didMutate: false,
          errors: undefined,
          data: undefined,
          userErrors: false,
          error: true,
        })
        if (Raven) Raven.captureException(e)
        if (opts.onError) opts.onError(e)
      },
    )
  }

  render() {
    return this.props.children(
      Object.assign({}, this.state, { mutate: this.mutate as any }),
    )
  }
}

export type Mutation<
  Result,
  Variables,
  UserError = undefined,
  ExtraData = undefined
> = React.SFC<{
  children: Children<Result, Variables, UserError, ExtraData>
}>

export const mutation = <
  Result,
  Variables,
  UserError = undefined,
  ExtraData = undefined
>(
  q: DocumentNode,
  opts: FactoryOpts<Result, Variables, UserError, ExtraData> = {} as any,
): Mutation<Result, Variables, UserError, ExtraData> => {
  const def = q.definitions[0]
  if (def.kind !== 'OperationDefinition')
    throw new Error('Mutation must have operation definition')
  if (def.operation !== 'mutation')
    throw new Error('Operation must be mutation')
  const operationName = def.name
  if (!operationName) throw new Error('Mutation must have name')

  return props => (
    <Consumer>
      {client => {
        if (!client) {
          throw new Error('Mutation component must be under <Provider>')
        }

        const variables = (props as any).variables
        const operationKey = `${operationName.value}.${Date.now()}.${Math.floor(
          Math.random() * 1000,
        )}`

        return (
          <MutationImpl
            client={client}
            mutation={q}
            operationKey={operationKey}
            operationName={operationName.value}
            checkInput={(opts as any).checkInput}
            checkResult={(opts as any).checkResult}
          >
            {props.children}
          </MutationImpl>
        )
      }}
    </Consumer>
  )
}
