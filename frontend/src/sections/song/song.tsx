import React from 'react'
import SongContainer, { Song as SongType } from 'containers/song'
import styled, { css } from 'react-emotion'
import * as parser from 'sections/song/parse'
import SongHeader from 'sections/song/song-header'
import * as page from 'utils/page'

const Placeholder = () => <div>Načítám píseň</div>

const line = (hasChords: boolean) =>
  hasChords
    ? css`
        margin-top: 1em;
      `
    : css``

const Chord = styled.span`
  position: ${(props: { sp?: boolean }) =>
    props.sp ? 'relative' : 'absolute'};
  transform: translateY(-1em);
  top: ${({ sp }) => (sp ? '-1em' : undefined)};
  font-weight: bold;
`

const Line: React.SFC<{ children: parser.Line }> = ({ children }) => {
  const parsed = children
  const hasChords = parsed.content.some(p => !!p.ch)
  return (
    <div className={line(hasChords)}>
      {parsed.tag && <b>{parsed.tag} </b>}
      {parsed.content.map((l, i) => (
        <span key={i}>
          {l.ch && l.ch.startsWith('_') ? (
            <Chord sp>{l.ch.substring(1)}</Chord>
          ) : (
            <Chord>{l.ch}</Chord>
          )}
          {l.text}
        </span>
      ))}
      <br />
    </div>
  )
}

const paragraph = css`
  margin-bottom: 1em;
`

const Paragraph: React.SFC<{ children: parser.Paragraph }> = ({ children }) => (
  <div className={paragraph}>
    {children.map((c, i) => <Line key={i}>{c}</Line>)}
  </div>
)

const songClass = css`
  position: relative;
  background: grey;
  width: ${page.width};
  height: ${page.height};
  padding: ${page.margin.top} ${page.margin.outer} ${page.margin.top}
    ${page.margin.inner};
  margin: 0 auto;
  @media print {
    padding: 0;
  }
`

const marginDisplay = css`
  background: white;
  width: 100%;
  height: 100%;
`

const SongLook = ({ song }: { song: SongType }) => (
  <div className={songClass}>
    <div className={marginDisplay}>
      <SongHeader {...song} />
      <div>
        {parser
          .parseSong(song.textWithChords)
          .map((p, i) => <Paragraph key={i}>{p}</Paragraph>)}
      </div>
    </div>
  </div>
)

const sizer = css`
  width: 100%;
  height: 100%;
  background: papayawhip;
`

const Song = ({ id }: { id: string }) => (
  <SongContainer variables={{ id }} placeholder={Placeholder}>
    {song =>
      !song.data || !song.data.song ? null : (
        <div className={sizer}>
          <SongLook song={song.data.song} />
        </div>
      )
    }
  </SongContainer>
)
export default Song
