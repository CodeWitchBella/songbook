import React from 'react'
import * as parser from '../../utils/song-parser/song-parser'
import { SongType } from '../../store/store-song'
import { PDFSongPage } from '../pdf-render/pdf-song-page'
import { PDFSettingsProvider } from '../pdf-render/pdf-settings'

const SongPage = ({
  song,
  pageNumber,
  pageData,
  noBack = false,
  transposition = 0,
}: {
  song: SongType
  pageData: parser.Paragraph[]
  transposition?: number
  pageNumber?: number
  noBack?: boolean
}) => (
  <PDFSettingsProvider
    value={{
      transpose: transposition,
      web: true,
      fontSize: song.fontSize,
      paragraphSpace: song.paragraphSpace,
      titleSpace: song.titleSpace,
    }}
  >
    <PDFSongPage
      author={song.author}
      footer=""
      left={typeof pageNumber === 'number' && pageNumber % 2 === 0}
      page={pageData}
      title={song.title}
      back={!noBack}
    />
  </PDFSettingsProvider>
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
          noBack={noBack || i !== 0}
          transposition={transposition}
        />
      ))}
    </>
  )
  return content
}
