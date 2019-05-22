/** @jsx jsx */
import { jsx, css } from '@emotion/core'
import React, { PropsWithChildren } from 'react'
import * as parser from 'utils/song-parser/song-parser'
import styled from '@emotion/styled'
import SongHeader from 'components/song-look/song-header'
import Page from 'components/page'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { SongType } from 'store/store'

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
    .split(/ \+/)
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
    <div css={line(hasChords)}>
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
  <div css={paragraph(song.paragraphSpace)}>
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

const BackButtonContainer = styled.div`
  position: absolute;

  display: flex;
  justify-content: right;
  margin-top: -0.5em;
  margin-right: 1em;
  @media print {
    display: none;
  }
`

function BackButtonImpl({
  children,
  location,
  history,
}: PropsWithChildren<RouteComponentProps<any>>) {
  return (
    <button
      css={{
        all: 'unset',
        display: 'block',
        color: 'darkblue',
        marginRight: '10px',
        textDecoration: 'underline',
        ':hover': {
          fontWeight: 'bold',
          textDecoration: 'none',
        },
      }}
      type="button"
      onClick={() => {
        if (location.state && location.state.canGoBack) history.goBack()
        else history.push('/')
      }}
    >
      {children}
    </button>
  )
}

const BackButton = withRouter(BackButtonImpl)

export const SongPage = ({
  song,
  number,
  pageNumber,
  pageData,
  noBack = false,
  transposition = 0,
}: {
  song: SongType
  pageData: parser.Paragraph[]
  transposition?: number
  number?: number
  pageNumber?: number
  noBack?: boolean
}) => (
  <Page left={typeof pageNumber === 'number' && pageNumber % 2 === 0}>
    {noBack ? null : (
      <BackButtonContainer>
        <BackButton>Zpět</BackButton>
      </BackButtonContainer>
    )}
    <SongHeader
      titleSpace={song.titleSpace}
      author={song.author}
      title={
        typeof number === 'number' ? `${number}. ${song.title}` : song.title
      }
    />
    <div css={fontSize(song.fontSize)}>
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
  noBack = false,
  transposition = 0,
}: {
  song: SongType
  parsed: parser.Paragraph[][]
  noBack?: boolean
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
          noBack={noBack}
          transposition={transposition}
        />
      ))}
    </>
  )
  return content
}
