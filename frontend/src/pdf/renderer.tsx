import Jspdf from 'jspdf'

export type Size = { height: number; width: number }
export type Dimension = Size & { x: number; y: number; first?: boolean }

class RElement<Props> {
  props: Readonly<Props>
  constructor(props: Props) {
    this.props = props
  }
}

export type PrimitiveChildren = (Primitive<any> | string)[]

export type RenderChild = (
  child: Primitive<any> | string,
  dim: Dimension,
) => Size

export type PrimitiveArgs = {
  dim: Dimension
  doc: Jspdf
  children: PrimitiveChildren
  renderChild: RenderChild
}

function getRenderChild(doc: Jspdf): RenderChild {
  const renderChild: RenderChild = (child, dim) => {
    if (typeof child === 'string')
      throw new Error('Cannot directly draw string')
    //console.log('rendering', 'name' in child ? (child as any).name : child)
    return child.draw({
      dim,
      doc,
      children: (child.props.children || []).map(
        (ch: any) => (typeof ch === 'string' ? ch : ch.type),
      ),
      renderChild,
    })
  }
  return renderChild
}

export class Primitive<Props> extends RElement<Props> {
  draw(args: PrimitiveArgs): Size {
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
    el.props.children = [].concat(...treeToPrimitives(children))
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
    const p:
      | {
          type: Primitive<any>
        }
      | {
          type: Primitive<any>
        }[] = treeToPrimitives(el)

    const primitives = Array.isArray(p) ? p : [p]

    const renderChild = getRenderChild(doc)
    let first = true
    for (const primitive of primitives) {
      if (!(primitive.type instanceof Primitive))
        throw new Error('Wrong argument to renderToPdf')

      renderChild(primitive.type, { x: 0, y: 0, width: -1, height: -1, first })
      first = false
    }

    return doc
  })
}
