/** @jsxImportSource @emotion/react */

import styled from '@emotion/styled'
import { ChordHelp } from 'components/chord-help'
import { useContinuousModeSetting } from 'components/continuous-mode'
import { SongLook } from 'components/song-look/song-look'
import SongMenu from 'components/song-look/song-menu'
import { useBasicStyle } from 'components/themed'
import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSong } from 'store/store'
import * as parser from 'utils/song-parser/song-parser'

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

function Spotify({ link }: { link: string }) {
  const parts = link.split('/')
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
        className="pointer-events-auto"
      />
    </SpotifyWrap>
  )
}

function queryJoin(path: string, query: string) {
  if (!query || query.startsWith('?')) return path + query
  return path + '?' + query
}

export default function SongSection({
  slug,
  enableMenu = false,
}: {
  slug: string
  enableMenu?: boolean
}) {
  const { song } = useSong({ slug })
  const [spotifyVisible, setSpotifyVisible] = useState(false)
  const [continuous] = useContinuousModeSetting()
  const parsed = song ? parser.parseSong('my', song.text, { continuous }) : null

  const location = useLocation()
  const navigate = useNavigate()
  const [chordHelp, setChordHelp] = useState('')
  const basicStyle = useBasicStyle()

  if (!song || !parsed) return null

  const query = new URLSearchParams(location.search)
  const tr = query.get('transposition')
  const transposition = Number.parseInt(
    `${(Array.isArray(tr) ? tr[0] : tr) || 0}`,
    10,
  )

  return (
    <React.Fragment>
      <div
        css={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          ...basicStyle,
        }}
      >
        <SongLook
          song={song}
          parsed={parsed}
          transposition={transposition}
          onChordPress={setChordHelp}
        />
      </div>
      {enableMenu && (
        <SongMenu
          song={song}
          setSpotifyVisible={setSpotifyVisible}
          showSpotify={!!song.spotify}
          transposition={transposition}
          setTransposition={(v) =>
            navigate(queryJoin(location.pathname, setTransposition(query, v)), {
              replace: true,
            })
          }
        />
      )}
      {spotifyVisible && song.spotify && <Spotify link={song.spotify} />}
      {chordHelp ? (
        <ChordHelp chord={chordHelp} close={() => setChordHelp('')} />
      ) : null}
    </React.Fragment>
  )
}

function setTransposition(query: URLSearchParams, value: number) {
  const res = new URLSearchParams(query)
  if (value) res.set('transposition', value + '')
  else res.delete('transposition')
  return res.toString()
}
