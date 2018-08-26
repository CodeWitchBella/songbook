// copied from https://github.com/DefinitelyTyped/DefinitelyTyped/pull/28089

declare module 'sharedb' {
  type UseCallback = ((
    request: {
      action: sharedb.Action
      agent: any
      req: any
      collection: string
      id: string
      query: any
      op: sharedb.RawOp
    },
    callback: () => void,
  ) => void)

  interface PubSubOptions {
    prefix?: string
  }
  interface Stream {
    id: string
  }

  export = sharedb

  class sharedb {
    constructor(options?: {
      db?: any
      pubsub?: sharedb.PubSub
      disableDocAction?: boolean
      disableSpaceDelimitedActions?: boolean
    })

    connect: () => sharedb.Connection

    addProjection(name: string, collection: string, fields: {}): any

    listen(stream: any): void

    close(callback?: (err: Error) => any): void

    use(action: sharedb.Action, fn: UseCallback): any

    types: {
      register: () => void
    }
  }

  namespace sharedb {
    export type Path = ReadonlyArray<string | number>
    export type Snapshot = number

    export interface AddNumOp {
      p: Path
      na: number
    }

    export interface ListInsertOp {
      p: Path
      li: any
    }
    export interface ListDeleteOp {
      p: Path
      ld: any
    }
    export interface ListReplaceOp {
      p: Path
      li: any
      ld: any
    }
    export interface ListMoveOp {
      p: Path
      lm: any
    }

    export interface ObjectInsertOp {
      p: Path
      oi: any
    }
    export interface ObjectDeleteOp {
      p: Path
      od: any
    }
    export interface ObjectReplaceOp {
      p: Path
      oi: any
      od: any
    }

    export interface StringInsertOp {
      p: Path
      si: string
    }
    export interface StringDeleteOp {
      p: Path
      sd: string
    }

    export interface SubtypeOp {
      p: Path
      t: string
      o: any
    }

    export type Op =
      | AddNumOp
      | ListInsertOp
      | ListDeleteOp
      | ListReplaceOp
      | ListMoveOp
      | ObjectInsertOp
      | ObjectDeleteOp
      | ObjectReplaceOp
      | StringInsertOp
      | StringDeleteOp
      | SubtypeOp

    export interface RawOp {
      src: string
      seq: number
      v: number
      op: Op[]
      m: any
      c: string
      d: string
    }
    export type OTType = 'ot-text' | 'ot-json0' | 'ot-text-tp2' | 'rich-text'
    export type Action =
      | 'connect'
      | 'op'
      | 'doc'
      | 'query'
      | 'submit'
      | 'apply'
      | 'commit'
      | 'after submit'
      | 'receive'
    export interface Error {
      code: number
      message: string
    }
    export interface ShareDBSourceOptions {
      source?: boolean
    }
    // interface ShareDBCreateOptions extends ShareDBSourceOptions {}
    // interface ShareDBDelOptions extends ShareDBSourceOptions {}
    // interface ShareDBSubmitOpOptions extends ShareDBSourceOptions {}

    export type Callback = (err: Error) => any

    export class Doc {
      type: string

      id: string

      data: any

      fetch: (callback: (err: Error) => void) => void

      subscribe: (callback: (err: Error) => void) => void

      on: (
        event: 'load' | 'create' | 'before op' | 'op' | 'del' | 'error',
        callback: (...args: any[]) => any,
      ) => void

      ingestSnapshot: (snapshot: Snapshot, callback: Callback) => void

      destroy: () => void

      create(data: any, callback?: Callback): void

      // eslint-disable-next-line no-dupe-class-members
      create(data: any, type?: OTType, callback?: Callback): void

      // eslint-disable-next-line no-dupe-class-members
      create(
        data: any,
        type?: OTType,
        options?: ShareDBSourceOptions,
        callback?: Callback,
      ): void

      submitOp: (
        data: ReadonlyArray<Op>,
        options?: ShareDBSourceOptions,
        callback?: Callback,
      ) => void

      del: (
        options: ShareDBSourceOptions,
        callback: (err: Error) => void,
      ) => void

      removeListener: (eventName: string, listener: () => any) => void
    }

    export class Query {
      ready: boolean

      results: Doc[]

      extra: any

      on: (
        event:
          | 'ready'
          | 'error'
          | 'changed'
          | 'insert'
          | 'move'
          | 'remove'
          | 'extra',
        callback: (...args: any[]) => any,
      ) => any

      destroy: () => void
    }

    abstract class PubSub {
      private static shallowCopy(obj: any)

      protected prefix?: string

      protected nextStreamId: number

      protected streamsCount: number

      protected streams: {
        [channel: string]: Stream
      }

      protected subscribed: {
        [channel: string]: boolean
      }

      protected constructor(options?: PubSubOptions)

      close(callback?: (err: Error | null) => void): void

      publish(
        channels: string[],
        data: { [k: string]: any },
        callback: (err: Error | null) => void,
      ): void

      subscribe(
        channel: string,
        callback: (err: Error | null, stream?: Stream) => void,
      ): void

      protected abstract _subscribe(
        channel: string,
        callback: (err: Error | null) => void,
      ): void

      protected abstract _unsubscribe(
        channel: string,
        callback: (err: Error | null) => void,
      ): void

      protected abstract _publish(
        channels: string[],
        data: any,
        callback: (err: Error | null) => void,
      ): void

      protected _emit(channel: string, data: { [k: string]: any }): void

      private _createStream(channel)

      private _removeStream(channel, stream)
    }

    class Connection {
      constructor(ws: any)

      get(collectionName: string, documentID: string): Doc

      createFetchQuery(
        collectionName: string,
        query: string,
        options: { results?: Query[] },
        callback: (err: Error, results: any) => any,
      ): Query

      createSubscribeQuery(
        collectionName: string,
        query: string,
        options: { results?: Query[] },
        callback: (err: Error, results: any) => any,
      ): Query
    }
  }
}
