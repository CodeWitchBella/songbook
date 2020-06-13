import React from 'react'
import * as parser from 'utils/song-parser/song-parser'
import { SongType } from 'store/store-song'
import { BackButton } from 'components/back-button'
import { PDFSongPage } from 'components/pdf-render/pdf-song-page'
import { PDFSettingsProvider } from 'components/pdf-render/pdf-settings'

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
          noBack={noBack}
          transposition={transposition}
        />
      ))}
    </>
  )
  return content
}
