import LeQuill from 'quill'
import { css } from 'react-emotion'

export const Quill = LeQuill

const chord = css`
  display: inline-block;
  white-space: nowrap;
  width: 0;
  -webkit-transform: translateY(-1em);
  -ms-transform: translateY(-1em);
  transform: translateY(-1em);
  font-weight: bold;
`
const spaceChord = css`
  display: inline-block;
  white-space: nowrap;
  -webkit-transform: translateY(-1em);
  -ms-transform: translateY(-1em);
  transform: translateY(-1em);
  font-weight: bold;
`

const withChord = css`
  margin-top: 0.9em !important;
`

const tag = css`
  padding-right: 0.3em;
`

let inited = false
export const init = () => {
  if (inited) return
  inited = true

  const Inline = Quill.import('blots/inline')

  class ChordBlot extends Inline {}
  ChordBlot.blotName = 'chord'
  ChordBlot.tagName = 'div'
  ChordBlot.className = chord
  Quill.register(ChordBlot)

  class SpaceChordBlot extends Inline {}
  SpaceChordBlot.blotName = 'spaceChord'
  SpaceChordBlot.tagName = 'div'
  SpaceChordBlot.className = spaceChord
  Quill.register(SpaceChordBlot)

  class TagBlot extends Inline {
    static create() {
      const node = super.create()
      node.classList.add(tag)
      return node
    }
  }
  TagBlot.blotName = 'tag'
  TagBlot.tagName = 'b'
  Quill.register(TagBlot)

  const Block = Quill.import('blots/block')
  class WithChord extends Block {}
  WithChord.blotName = 'withChord'
  WithChord.tagName = 'p'
  WithChord.className = withChord
  Quill.register(WithChord)
}
