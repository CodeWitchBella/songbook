import React from 'react'
import SongContainer, { Song as SongType } from 'containers/song'
import styled, { css } from 'react-emotion'
import * as parser from 'sections/song/parse'
import SongHeader from 'sections/song/song-header'

const Placeholder = () => <div>Načítám píseň</div>

const line = (hasChords: boolean) =>
  hasChords
    ? css`
        margin-top: 1em;
      `
    : css``

const Chord = styled.span`
  position: absolute;
  transform: translateY(-1em);
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
          {l.ch && <Chord>{l.ch}</Chord>}
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

const SongLook = ({ song }: { song: SongType }) => (
  <div>
    <SongHeader {...song} />
    <div>
      {parser
        .parseSong(song.textWithChords)
        .map((p, i) => <Paragraph key={i}>{p}</Paragraph>)}
    </div>
  </div>
)

const songClass = css``

const Song = ({ id }: { id: string }) => (
  <SongContainer variables={{ id }} placeholder={Placeholder}>
    {song =>
      !song.data || !song.data.song ? null : (
        <div className={songClass}>
          <SongLook song={song.data.song} />
        </div>
      )
    }
  </SongContainer>
)
export default Song
