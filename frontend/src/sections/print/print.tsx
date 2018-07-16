import React from 'react'
import styled from 'react-emotion'
import Contents from 'sections/contents/contents'
import TitlePage from 'sections/title-page/title-page'
import { parseSong, Paragraph } from 'utils/parse-song'
import { SongPage } from 'components/song-look/song-look'
import { AudioProvider } from 'components/song-look/audio-player'
import { SongsInTag, Songs, Tag, SongType } from 'containers/store/store'

const PlaceholderSongList = () => <div>Načítám seznam písní</div>

const Print = ({ tag }: { tag: string }) => (
  <SongsInTag tag={tag}>
    {songList => (
      <Songs ids={songList.map(s => s.id)}>
        {songs =>
          !songs
            ? null
            : (() => {
                const pages = songs
                  .map((song, number) => ({
                    data: song,
                    parsed: parseSong(song.textWithChords),
                    number,
                  }))
                  .reduce(
                    (arr, el) =>
                      arr.concat([
                        {
                          ...el,
                          pageNumber:
                            arr.length === 0
                              ? 1
                              : arr[arr.length - 1].pageNumber +
                                arr[arr.length - 1].parsed.length,
                        },
                      ]),
                    [] as {
                      data: SongType
                      parsed: Paragraph[][]
                      number: number
                      pageNumber: number
                    }[],
                  )
                  .map(cur => {
                    const content = cur.parsed
                      .map((page, i) => ({
                        data: cur.data,
                        page,
                        number: cur.number,
                        key: `${cur.data.id}-${i}`,
                      }))
                      .map((s, i) => (
                        <SongPage
                          pageData={s.page}
                          song={{
                            title:
                              cur.parsed.length > 1
                                ? `${s.data.title} (${i + 1}/${
                                    cur.parsed.length
                                  })`
                                : s.data.title,
                            metadata: s.data.metadata,
                            id: s.data.id,
                            author: s.data.author,
                          }}
                          number={s.number + 1}
                          pageNumber={cur.pageNumber + i + 1}
                          key={s.key}
                        />
                      ))
                    if (cur.data.metadata.audio) {
                      return (
                        <AudioProvider
                          key={cur.data.id}
                          src={cur.data.metadata.audio}
                        >
                          {content}
                        </AudioProvider>
                      )
                    }
                    return (
                      <React.Fragment key={cur.data.id}>
                        {content}
                      </React.Fragment>
                    )
                  })

                return (
                  <Tag id={tag}>
                    {t =>
                      t ? (
                        <div>
                          <TitlePage image={t.cover || undefined} />
                          <main>{pages}</main>
                          <Contents list={songs} left />
                        </div>
                      ) : null
                    }
                  </Tag>
                )
              })()
        }
      </Songs>
    )}
  </SongsInTag>
)
export default Print
