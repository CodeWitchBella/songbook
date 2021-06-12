import React from 'react'
import * as parser from 'utils/song-parser/song-parser'
import { SongType } from 'store/store-song'
import { PDFSongPage } from 'components/pdf-render/pdf-song-page'
import { PDFSettingsProvider } from 'components/pdf-render/pdf-settings'

function SongPage({
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
}) {
  const pretranspose =
    typeof song.pretranspose === 'number' ? song.pretranspose : 0
  return (
    <PDFSettingsProvider
      value={{
        transpose: transposition + pretranspose,
        web: {
          onChordPress: (chord) => {
            console.log(chord)
          },
        },
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
}

export function SongLook({
  song,
  parsed,
  noBack = false,
  transposition = 0,
}: {
  song: SongType
  parsed: parser.Paragraph[][]
  noBack?: boolean
  transposition?: number
}) {
  return (
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
}
