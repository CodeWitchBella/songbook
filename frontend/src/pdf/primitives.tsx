import Jspdf from 'jspdf'
import * as R from './renderer'

export class Text extends R.Primitive<{
  children: string | string[]
  size?: number
}> {
  name = 'Text'
  draw({ dim, children, doc }: R.PrimitiveArgs) {
    console.log('Text', children, dim)
    let text = ''
    if (typeof children === 'string') {
      text = children
    } else if (Array.isArray(children)) {
      text = children.join('')
    }
    const pt2mm = 0.352778
    const textDim = doc.getTextDimensions(text)
    doc.text(text, dim.x, dim.y + textDim.h * pt2mm)
    return { width: textDim.w * pt2mm, height: textDim.h * pt2mm }
  }
}

export class Column extends R.Primitive<{
  children: R.JSX.Node
}> {
  name = 'Column'
  draw({ dim, children, doc, renderChild }: R.PrimitiveArgs) {
    console.log('Column', children, dim)
    let { y } = dim
    for (const ch of children) {
      if (typeof ch === 'string')
        throw new Error('Column cant have string children')
      const size = renderChild(ch, {
        x: dim.x,
        y,
        width: dim.width,
        height: dim.height - y + dim.y,
      })
      y += size.height
    }
    return { width: 0, height: 0 }
  }
}

export class Page extends R.Primitive<{ children: R.JSX.Node }> {
  name = 'Page'
  draw({ dim, children, doc, renderChild }: R.PrimitiveArgs) {
    if (children.length !== 1) {
      throw new Error('Page must have one child')
    }
    if (typeof children[0] === 'string') {
      throw new Error('Page cannot have string as child')
    }
    if (dim.width >= 0 || dim.height >= 0) {
      throw new Error('Page must be root element')
    }
    if (!dim.first) {
      doc.addPage()
    }
    const size = { width: 210, height: 297 }
    for (const ch of children) {
      renderChild(ch, { x: 0, y: 0, ...size })
    }

    return size
  }
}
