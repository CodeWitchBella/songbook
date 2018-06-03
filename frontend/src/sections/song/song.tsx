import React from 'react'
import SongContainer, { Song as SongType } from 'containers/song'
import styled, { css } from 'react-emotion'
import * as parser from 'sections/song/parse'
import SongHeader from 'sections/song/song-header'
import * as page from 'utils/page'
import Page from 'components/page'

const Placeholder = () => <div>Načítám píseň</div>

const line = (hasChords: boolean) =>
  hasChords
    ? css`
        line-height: 2.3em;
        vertical-align: baseline;
        > * {
          display: inline-block;
          position: relative;
          transform: translateY(0.5em);
        }
      `
    : css`
        line-height: 1.3em;
        vertical-align: baseline;
      `

const Chord = styled.span`
  position: ${(props: { sp?: boolean }) =>
    props.sp ? 'relative' : 'absolute'};
  transform: translateY(-1em);
  top: ${({ sp }) => (sp ? '-1em' : undefined)};
  font-weight: bold;
  width: 100vw;
`

const Line: React.SFC<{ children: parser.Line }> = ({ children }) => {
  const parsed = children
  const hasChords = parsed.content.some(p => !!p.ch)
  return (
    <div className={line(hasChords)}>
      {parsed.tag && <b>{parsed.tag}&nbsp;</b>}
      {parsed.content.map((l, i) => (
        <span key={i}>
          {l.ch && l.ch.startsWith('_') ? (
            <Chord sp>{l.ch.substring(1)}</Chord>
          ) : (
            <Chord>{l.ch}</Chord>
          )}
          {l.text.replace(/ $/, '\u00a0').replace(/^ /, '\u00a0')}
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

const SongLook = ({ song, number }: { song: SongType; number?: number }) => (
  <Page left={typeof number === 'number' && number % 2 === 0}>
    <SongHeader
      author={song.author}
      title={
        typeof number === 'number' ? `${number}. ${song.title}` : song.title
      }
    />
    <div>
      {parser
        .parseSong(song.textWithChords)
        .map((p, i) => <Paragraph key={i}>{p}</Paragraph>)}
    </div>
  </Page>
)

const Song = ({ id, number }: { id: string; number?: number }) => (
  <SongContainer variables={{ id }} placeholder={Placeholder}>
    {song =>
      !song.data || !song.data.song ? null : (
        <SongLook number={number} song={song.data.song} />
      )
    }
  </SongContainer>
)
export default Song
