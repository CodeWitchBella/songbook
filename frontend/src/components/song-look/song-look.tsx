/** @jsx jsx */
import { jsx } from '@emotion/core'
import React, { useEffect, PropsWithChildren } from 'react'
import * as parser from 'utils/parse-song'
import styled from '@emotion/styled'
import { css } from 'emotion'
import SongHeader from 'components/song-look/song-header'
import Page from 'components/page'
import { AudioProvider, AudioControls } from 'components/song-look/audio-player'
import { Link } from 'react-router-dom'
import ShareButton from 'components/song-look/share-button'

type SongType = Pick<any, 'author' | 'id' | 'metadata' | 'title'>

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

const Chord = ({ children, sp }: PropsWithChildren<{ sp?: boolean }>) => (
  <span
    css={css`
      position: ${sp ? 'relative' : 'absolute'};
      transform: translateY(-1em);
      top: ${sp ? '-1em' : undefined};
      font-weight: bold;
      width: 100vw;
    `}
  >
    {children}
  </span>
)

const notes = [
  ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'H'],
  ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'B', 'H'],
]

const iterableNotes = notes.map(list => ({
  list,
  iterable: list
    .map((note, idx) => ({ note, idx }))
    .sort((a, b) => b.note.length - a.note.length),
}))

function remainder(num: number, div: number) {
  while (num < 0) num += div
  while (num >= div) num -= div
  return num
}

function transposeChord(chord: string, transposition: number) {
  for (const list of iterableNotes) {
    for (const note of list.iterable) {
      if (chord.startsWith(note.note)) {
        return chord.replace(
          note.note,
          list.list[remainder(note.idx + transposition, list.iterable.length)],
        )
      }
    }
  }
  return chord
}

function transposeChords(tags: string, transposition: number) {
  return tags
    .split(/ /)
    .map(t => transposeChord(t, transposition))
    .join(' ')
}

const Line: React.SFC<{ children: parser.Line; transposition: number }> = ({
  children,
  transposition,
}) => {
  const parsed = children
  const hasChords = parsed.content.some(p => !!p.ch)
  return (
    <div className={line(hasChords)}>
      {parsed.tag && (
        <b>
          {parsed.tag}
          &nbsp;
        </b>
      )}
      {parsed.content.map((l, i, list) => (
        <span key={i}>
          {l.ch && l.ch.startsWith('_') ? (
            <Chord sp>
              {transposeChords(l.ch.substring(1), transposition)}
            </Chord>
          ) : (
            <Chord sp={i === list.length - 1 && l.text.trim() === ''}>
              {transposeChords(l.ch, transposition)}
            </Chord>
          )}
          {l.text.replace(/ $/, '\u00a0').replace(/^ /, '\u00a0')}
        </span>
      ))}
      <br />
    </div>
  )
}

const paragraph = (paragraphSpace: number) => css`
  margin-bottom: ${paragraphSpace}em;
`

const Paragraph: React.SFC<{
  children: parser.Paragraph
  song: SongType
  transposition: number
}> = ({ children, song, transposition }) => (
  <div className={paragraph(song.metadata.paragraphSpace || 1)}>
    {children.map((c, i) => (
      <Line key={i} transposition={transposition}>
        {c}
      </Line>
    ))}
  </div>
)

const fontSize = (size: number) =>
  css`
    font-size: ${size}em;
  `

const EditButtonContainer = styled.div`
  position: absolute;
  right: 0;
  display: flex;
  justify-content: right;
  margin-top: -0.5em;
  margin-right: 1em;
  @media print {
    display: none;
  }
`
const EditButton = styled(Link)({
  display: 'block',
  color: 'darkblue',
  marginLeft: '10px',
})

const shareButton = css`
  width: 100%;
  height: 0;
  display: flex;
  justify-content: center;
  @media print {
    display: none;
  }
`

export const SongPage = ({
  song,
  number,
  pageNumber,
  pageData,
  noEdit = false,
  share = false,
  transposition = 0,
}: {
  song: SongType
  pageData: parser.Paragraph[]
  transposition?: number
  number?: number
  pageNumber?: number
  noEdit?: boolean
  share?: boolean
}) => (
  <Page left={typeof pageNumber === 'number' && pageNumber % 2 === 0}>
    <AudioControls />
    {share && (
      <ShareButton
        title={`${song.title} - ${song.author}`}
        className={shareButton}
      />
    )}
    {noEdit ? null : (
      <EditButtonContainer>
        <EditButton to={`/edit/${song.id}`}>Upravit</EditButton>
        <EditButton to={`/pdf/${song.id}`}>PDF</EditButton>
      </EditButtonContainer>
    )}
    <SongHeader
      titleSpace={song.metadata.titleSpace}
      author={song.author}
      title={
        typeof number === 'number' ? `${number}. ${song.title}` : song.title
      }
    />
    <div className={fontSize(song.metadata.fontSize || 1)}>
      {pageData.map((p, i) => (
        <Paragraph song={song} key={i} transposition={transposition}>
          {p}
        </Paragraph>
      ))}
    </div>
  </Page>
)

export const SongLook = ({
  song,
  parsed,
  noEdit = false,
  share = false,
  transposition = 0,
}: {
  song: SongType
  parsed: parser.Paragraph[][]
  noEdit?: boolean
  share?: boolean
  transposition?: number
}) => {
  const content = (
    <>
      {parsed.map((pageData, i) => (
        <SongPage
          key={i}
          pageData={pageData}
          song={{
            ...song,
            title:
              parsed.length > 1
                ? `${song.title} (${i + 1}/${parsed.length})`
                : song.title,
          }}
          noEdit={noEdit}
          share={share}
          transposition={transposition}
        />
      ))}
    </>
  )
  if (song.metadata.audio)
    return <AudioProvider src={song.metadata.audio}>{content}</AudioProvider>
  return content
}
