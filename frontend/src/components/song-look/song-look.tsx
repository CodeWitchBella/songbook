import React from 'react'
import * as parser from 'utils/parse-song'
import styled, { css } from 'react-emotion'
import { everything_songs } from 'containers/store/__generated__/everything'
import SongHeader from 'components/song-look/song-header'
import Page from 'components/page'
import { AudioProvider, AudioControls } from 'components/song-look/audio-player'
import { Link } from 'react-router-dom'
import ShareButton from 'components/song-look/share-button'

type SongType = Pick<everything_songs, 'author' | 'id' | 'metadata' | 'title'>

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
      {parsed.content.map((l, i, list) => (
        <span key={i}>
          {l.ch && l.ch.startsWith('_') ? (
            <Chord sp>{l.ch.substring(1)}</Chord>
          ) : (
            <Chord sp={i === list.length - 1 && l.text.trim() === ''}>
              {l.ch}
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

const Paragraph: React.SFC<{ children: parser.Paragraph; song: SongType }> = ({
  children,
  song,
}) => (
  <div className={paragraph(song.metadata.paragraphSpace || 1)}>
    {children.map((c, i) => <Line key={i}>{c}</Line>)}
  </div>
)

const fontSize = (size: number) =>
  css`
    font-size: ${size}em;
  `

const EditButtonContainer = styled.div`
  position: absolute;
  width: 100%;
  @media print {
    display: none;
  }
`
const EditButton = styled(Link)`
  position: absolute;
  right: 0;
  display: block;
  transform: translate(-50%, -50%);
  color: darkblue;
`

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
}: {
  song: SongType
  pageData: parser.Paragraph[]
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
        <Paragraph song={song} key={i}>
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
}: {
  song: SongType
  parsed: parser.Paragraph[][]
  noEdit?: boolean
  share?: boolean
}) => {
  const content = (
    <>
      {parsed.map((pageData, i) => (
        <SongPage
          key={i}
          pageData={pageData}
          song={song}
          noEdit={noEdit}
          share={share}
        />
      ))}
    </>
  )
  if (song.metadata.audio)
    return <AudioProvider src={song.metadata.audio}>{content}</AudioProvider>
  return content
}
