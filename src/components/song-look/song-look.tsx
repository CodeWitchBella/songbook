import React from 'react'
import * as parser from 'utils/song-parser/song-parser'
import { SongType } from 'store/store-song'
import {
  PDFSongContent,
  PDFSongPage,
} from 'components/pdf-render/pdf-song-page'
import { PDFSettingsProvider } from 'components/pdf-render/pdf-settings'
import { View } from 'react-native'

function SongPage({
  song,
  pageNumber,
  pageData,
  noBack = false,
  transposition = 0,
  onChordPress = null,
}: {
  song: SongType
  pageData: parser.Paragraph[]
  transposition?: number
  pageNumber?: number
  noBack?: boolean
  onChordPress?: null | ((chord: string) => void)
}) {
  const pretranspose =
    typeof song.pretranspose === 'number' ? song.pretranspose : 0
  return (
    <PDFSettingsProvider
      value={{
        transpose: transposition + pretranspose,
        web: { onChordPress },
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

function SongContinousPage({
  song,
  pageData,
  transposition = 0,
  onChordPress = null,
}: {
  song: SongType
  pageData: parser.Paragraph[]
  transposition?: number
  onChordPress?: null | ((chord: string) => void)
}) {
  const pretranspose =
    typeof song.pretranspose === 'number' ? song.pretranspose : 0
  return (
    <PDFSettingsProvider
      value={{
        transpose: transposition + pretranspose,
        web: { onChordPress },
        fontSize: song.fontSize,
        paragraphSpace: song.paragraphSpace,
        titleSpace: song.titleSpace,
      }}
    >
      <View>
        <PDFSongContent
          author={song.author}
          footer=""
          left={false}
          page={pageData}
          title={song.title}
          back={true}
        />
      </View>
    </PDFSettingsProvider>
  )
}

export function SongLook({
  song,
  parsed,
  noBack = false,
  transposition = 0,
  onChordPress,
  continous,
}: {
  song: SongType
  parsed: parser.Paragraph[][]
  noBack?: boolean
  transposition?: number
  onChordPress?: (chord: string) => void
  continous: boolean
}) {
  if (continous) {
    return (
      <SongContinousPage
        pageData={parsed.flat(1)}
        song={song}
        transposition={transposition}
        onChordPress={onChordPress}
      />
    )
  }
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
          onChordPress={onChordPress}
        />
      ))}
    </>
  )
}
