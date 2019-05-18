/** @jsx jsx */
import { jsx } from '@emotion/core'
import React, { useState } from 'react'
import { SongLook } from 'components/song-look/song-look'
import * as parser from 'utils/parse-song'
import styled from '@emotion/styled'
import { useSong } from 'store/store'
import SongMenu from 'components/song-look/song-menu'
import { Route } from 'react-router-dom'
import queryString from 'query-string'

const IFrame = (props: any) => <iframe title="Spotify přehrávač" {...props} />

const SpotifyWrap = styled.div`
  display: flex;
  position: absolute;
  bottom: 0;
  width: 100%;
  justify-content: flex-start;
  align-items: start;
  pointer-events: none;
`

class Spotify extends React.Component<{ link: string }, { visible: boolean }> {
  render() {
    const parts = this.props.link.split('/')
    return (
      <SpotifyWrap>
        <IFrame
          src={`https://open.spotify.com/embed/${parts[parts.length - 2]}/${
            parts[parts.length - 1]
          }`}
          height="80"
          frameBorder="0"
          allowtransparency="true"
          allow="encrypted-media"
          css={{ pointerEvents: 'all' }}
        />
      </SpotifyWrap>
    )
  }
}

function queryJoin(path: string, query: string) {
  if (!query || query.startsWith('?')) return path + query
  return path + '?' + query
}

const SongSection = ({
  slug,
  enableMenu = false,
}: {
  slug: string
  enableMenu?: boolean
}) => {
  const { song } = useSong({ slug })
  const [spotifyVisible, setSpotifyVisible] = useState(false)
  console.log(song)
  if (!song) return null
  console.log('song id:', song.id)
  const { longData, shortData } = song
  if (!longData || !shortData) return null

  return (
    <Route>
      {route => {
        const query = queryString.parse(route.location.search)
        const tr = query.transposition
        const transposition = Number.parseInt(
          (Array.isArray(tr) ? tr[0] : tr) || '0',
          10,
        )
        return (
          <>
            <div
              css={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <SongLook
                song={{ shortData, longData }}
                parsed={parser.parseSong(longData.text)}
                transposition={transposition}
              />
            </div>
            {enableMenu && (
              <SongMenu
                slug={slug}
                setSpotifyVisible={setSpotifyVisible}
                showSpotify={!!longData.spotify}
                transposition={transposition}
                setTransposition={v =>
                  route.history.replace(
                    queryJoin(
                      route.location.pathname,
                      queryString.stringify({
                        ...query,
                        transposition: v || undefined,
                      }),
                    ),
                  )
                }
              />
            )}
            {spotifyVisible && longData.spotify && (
              <Spotify link={longData.spotify} />
            )}
          </>
        )
      }}
    </Route>
  )
}
export default SongSection
