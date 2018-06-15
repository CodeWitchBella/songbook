import React from 'react'
import Quill from 'quill'
import { parseSongToDelta, stringifySongFromDelta } from 'utils/parse-song'
import styled from 'react-emotion'

const bindings = {
  tab: {
    key: 9,
    handler(range: any, context: any) {
      const quill = (this as any).quill

      quill.format('chord', !context.format.chord, 'user')

      const offset =
        quill
          .getText()
          .substring(range.index)
          .indexOf('\n') + range.index

      const count =
        (quill.getFormat(offset, 1).withChord || 0) +
        (context.format.chord ? -1 : 1)

      if (count === 0) {
        quill.formatText(offset, 1, 'withChord', false, 'silent')
      } else {
        quill.formatText(offset, 1, 'withChord', count, 'silent')
      }

      //quill.formatText(range, 'chord', !quill.getFormat().chord, 'user')
    },
  },
}

const Container = styled.div`
  padding-top: 1em;
  div:focus {
    outline: none !important;
  }
  p {
    margin: 0;
    line-height: 1.3em;
    vertical-align: baseline;
    display: block;
  }
`

export default class QuillEditor extends React.Component<{
  initialValue: string
  onChange: (value: string) => void
}> {
  ref = React.createRef<HTMLDivElement>()
  quill?: Quill

  render() {
    return (
      <Container>
        <div ref={this.ref} />
      </Container>
    )
  }

  onInit() {
    const quill = this.quill
    if (!quill) throw new Error('No quill!?')

    /*
    Too many edge cases to do this properly :-(
      - Inserts of various symbols creating tag R -> R:, : -> R:, 1: -> R1:
      - Deletes of various symbols deleting tag R: -> R, R: -> :, \nR: -> R:
      - Inserts of symbols deleting tag R: -> RA:
    quill.on('text-change', (delta, oldDelta, source) => {
      if (source === 'user' && delta && delta.ops && delta.ops.length === 2) {
        const insert = delta.ops[1].insert
        const retain = delta.ops[0].retain
        if (insert === ':' && retain) {
          const prefix = quill.getText(
            Math.max(0, retain - 3),
            Math.min(retain, 3),
          )
          const match =
            /\n(S|R[1-9]?)$/.exec(prefix) || /^(S|R[1-9]?)$/.exec(prefix)
          if (match) {
            quill.formatText(
              retain - match[1].length,
              match[1].length,
              'tag',
              true,
            )
          }
        }
      }
    })
    */
    quill.on('text-change', (delta, oldDelta, source) => {
      this.props.onChange(stringifySongFromDelta(quill.getContents()))
    })
    const delta = parseSongToDelta(this.props.initialValue)
    quill.setContents(delta)
  }

  componentDidMount() {
    const ref = this.ref.current
    if (typeof document !== 'undefined' && ref) {
      import('./quill')
        .then(q => {
          q.init()
          this.quill = new q.Quill(ref, {
            formats: ['chord', 'tag', 'spaceChord', 'withChord'],
            modules: {
              keyboard: {
                bindings,
              },
            },
          })
          this.onInit()
        })
        .catch(e => console.error(e))
    }
  }
}
