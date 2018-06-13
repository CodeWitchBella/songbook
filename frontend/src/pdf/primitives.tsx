import Jspdf from 'jspdf'
import * as R from './renderer'

export class Text extends R.Primitive<{
  children: string | string[]
  size?: number
}> {
  name = 'Text'
  draw(dim: R.Dimension, doc: Jspdf, children: R.PrimitiveChildren) {
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
  draw(dim: R.Dimension, doc: Jspdf, children: R.PrimitiveChildren) {
    console.log('Column', children, dim)
    let { y } = dim
    for (const ch of children) {
      if (typeof ch === 'string')
        throw new Error('Column cant have string children')
      const size = ch.type.draw(
        { x: dim.x, y, width: dim.width, height: dim.height - y + dim.y },
        doc,
        ch.type.props.children || [],
      )
      y += size.height
    }
    return { width: 0, height: 0 }
  }
}

export class Page extends R.Primitive<{ children: R.JSX.Node }> {
  name = 'Page'
  draw(dim: R.Dimension, doc: Jspdf) {
    return { width: 0, height: 0 }
  }
}
