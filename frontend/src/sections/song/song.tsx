import React, { useState } from 'react'
import { SongLook } from 'components/song-look/song-look'
import * as parser from 'utils/parse-song'
import styled from '@emotion/styled'
import { useSong } from 'store/song-provider'
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

const SpotifyButton = styled.button`
  pointer-events: all;
  width: 80px;
  height: 80px;
  background: white;
  font-size: 40px;
  border: 1px solid black;
  :hover {
    background: #eee;
  }
`

class Spotify extends React.Component<{ link: string }, { visible: boolean }> {
  state = { visible: false }
  toggle = () =>
    this.setState(st => ({
      visible: !st.visible,
    }))
  render() {
    const parts = this.props.link.split('/')
    return (
      <SpotifyWrap>
        {this.state.visible && (
          <IFrame
            src={`https://open.spotify.com/embed/${parts[parts.length - 2]}/${
              parts[parts.length - 1]
            }`}
            height="80"
            frameBorder="0"
            allowtransparency="true"
            allow="encrypted-media"
          />
        )}
        <SpotifyButton type="button" onClick={this.toggle}>
          {this.state.visible ? '⛌' : '⏯'}
        </SpotifyButton>
      </SpotifyWrap>
    )
  }
}

function queryJoin(path: string, query: string) {
  if (!query || query.startsWith('?')) return path + query
  return path + '?' + query
}

const SongSection = ({
  id,
  share = false,
  enableMenu = false,
}: {
  id: string
  share?: boolean
  enableMenu?: boolean
}) => {
  const song = useSong(id).value
  const [spotifyVisible, setSpotifyVisible] = useState(false)

  return !song ? null : (
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
            <SongLook
              share={share}
              song={song}
              parsed={parser.parseSong(song.textWithChords)}
              transposition={transposition}
            />
            {enableMenu && (
              <SongMenu
                songId={id}
                setSpotifyVisible={setSpotifyVisible}
                showSpotify={!!song.metadata.spotify}
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
            {spotifyVisible && song.metadata.spotify && (
              <Spotify link={song.metadata.spotify} />
            )}
          </>
        )
      }}
    </Route>
  )
}
export default SongSection
