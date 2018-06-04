import React from 'react'
import * as parser from 'utils/parse-song'
import styled, { css } from 'react-emotion'
import { Song as SongType } from 'containers/song'
import SongHeader from 'components/song-look/song-header'
import Page from 'components/page'
import { AudioProvider, AudioControls } from 'components/song-look/audio-player'

const line = (hasChords: boolean) =>
  hasChords
    ? css`
        line-height: 2.2em;
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

export const SongPage = ({
  song,
  number,
  pageNumber,
  pageData,
}: {
  song: SongType
  pageData: parser.Paragraph[]
  number?: number
  pageNumber?: number
}) => (
  <Page left={typeof pageNumber === 'number' && pageNumber % 2 === 0}>
    <AudioControls />
    <SongHeader
      author={song.author}
      title={
        typeof number === 'number' ? `${number}. ${song.title}` : song.title
      }
    />
    <div>{pageData.map((p, i) => <Paragraph key={i}>{p}</Paragraph>)}</div>
  </Page>
)

export const SongLook = ({
  song,
  parsed,
}: {
  song: SongType
  parsed: parser.Paragraph[][]
}) => {
  const content = (
    <>
      {parsed.map((pageData, i) => (
        <SongPage key={i} pageData={pageData} song={song} />
      ))}
    </>
  )
  if (song.metadata.audio)
    return <AudioProvider src={song.metadata.audio}>{content}</AudioProvider>
  return content
}
