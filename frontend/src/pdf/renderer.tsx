import Jspdf from 'jspdf'

export type Size = { height: number; width: number }
export type Dimension = Size & { x: number; y: number }

class RElement<Props> {
  props: Readonly<Props>
  constructor(props: Props) {
    this.props = props
  }
}

export type PrimitiveChildren = ({ type: Primitive<any> } | string)[]

export class Primitive<Props> extends RElement<Props> {
  draw(container: Dimension, doc: Jspdf, children: PrimitiveChildren): Size {
    throw new Error('You cannot draw Primitive directly')
  }
}

export class Component<Props> extends RElement<Props> {
  render(): JSX.Element {
    throw new Error('Cannot render Component directly')
  }
}

export namespace JSX {
  export interface ElementClass extends RElement<any> {}
  export interface ElementAttributesProperty {
    props: any
  }
  export interface Element {
    type: RElement<any> | ((props: any) => JSX.Element)
    props: any
  }
  export interface ElementChildrenAttribute {
    children: {}
  }
  export type Node = Element | Element[] | string
}

export const h = (
  Type: any,
  p: any,
  ...children: JSX.Element[]
): JSX.Element => {
  if (typeof Type === 'string')
    throw new Error('Intrinsic elements (lowercase) are not supported')

  const props = Object.assign({}, p, { children })
  if (Type.prototype instanceof RElement) {
    return {
      type: new Type(props),
      props,
    }
  }
  return { type: Type, props }
}

function elementToPrimitives(el: JSX.Element) {
  const { type } = el
  if (type instanceof Component) {
    return type.render()
  }
  if (typeof type === 'function') {
    return type(el.props)
  }
  return el
}

function treeToPrimitives(el_: JSX.Element[] | JSX.Element | string): any {
  if (typeof el_ === 'string') return el_
  if (Array.isArray(el_)) return el_.map(treeToPrimitives)
  let el = el_
  let counter = 0
  // convert everything to Primitive
  while (!(el.type instanceof Primitive)) {
    counter += 1
    if (counter > 100) {
      console.log({ el, el_ })
      throw new Error('treeToPrimitives failed')
    }
    el = elementToPrimitives(el)
  }

  const { children } = el.props
  if (children) {
    el.props.children = treeToPrimitives(children)
  }

  return el
}

export function renderToPdf(el: JSX.Element) {
  return import('jspdf').then(jspdf => {
    const JsPDF = jspdf.default
    const doc = new JsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a6',
    })
    const primitive: {
      type: Primitive<any>
    } = treeToPrimitives(el)

    console.log(primitive)

    if (!(primitive.type instanceof Primitive))
      throw new Error('Wrong argument to renderToPdf')

    primitive.type.draw(
      { x: 0, y: 0, width: 210, height: 297 },
      doc,
      primitive.type.props.children || [],
    )
    return doc
  })
}
