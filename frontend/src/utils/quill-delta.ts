import * as qd from 'quill-delta'
import * as q from 'quill'

export class Delta extends ((qd.default as any) as {
  new (ops?: DeltaOperation[] | { ops: DeltaOperation[] }): q.Delta
}) {}

export type DeltaOperation = q.DeltaOperation
