/** @jsxImportSource @emotion/react */

import React, { useState, useEffect, useRef } from 'react'
import { SongLook } from 'components/song-look/song-look'
import * as parser from 'utils/song-parser/song-parser'
import styled from '@emotion/styled'
import SongMenu from 'components/song-look/song-menu'
import { useLocation } from 'react-router-dom'
import { useAutoUpdatedSong } from 'utils/firebase'
import { useNavigate } from 'utils/use-navigate'
import { graphqlFetch } from 'store/graphql'

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
        css={{ pointerEvents: 'all' }}
      />
    </SpotifyWrap>
  )
}

function queryJoin(path: string, query: string) {
  if (!query || query.startsWith('?')) return path + query
  return path + '?' + query
}

function useSetWindowMethod(name: string, method: Function) {
  const ref = useRef(method)
  useEffect(() => {
    ref.current = method
  })
  useEffect(() => {
    function cur(this: any, ...args: any[]) {
      return ref.current.apply(this, args)
    }
    const prev = (window as any)[name]
    ;(window as any)[name] = cur
    return () => {
      if ((window as any)[name] === cur) {
        ;(window as any)[name] = prev
      }
    }
  }, [name])
}

export default function SongSection({
  slug,
  enableMenu = false,
}: {
  slug: string
  enableMenu?: boolean
}) {
  const { song } = useAutoUpdatedSong({ slug })
  const [spotifyVisible, setSpotifyVisible] = useState(false)
  const parsed = song ? parser.parseSong('my', song.text) : null

  const pageCount = parsed && parsed.length
  useEffect(() => {
    if (song) {
      console.log('song id:', song.id, 'title:', song.title, `(${pageCount})`)
    }
  }, [pageCount, song])
  useSetWindowMethod('addToCollection', (collection: string) => {
    if (!song) throw new Error('No song')
    graphqlFetch({
      query: `mutation($collection: String! $song: String!) { addToCollection(collection: $collection song: $song) }`,
      variables: { collection, song: song.id },
    }).then(
      (res) => void console.log(res),
      (err) => void console.error(err),
    )
  })
  useSetWindowMethod('removeFromCollection', (collection: string) => {
    if (!song) throw new Error('No song')
    graphqlFetch({
      query: `mutation($collection: String! $song: String!) { removeFromCollection(collection: $collection song: $song) }`,
      variables: { collection, song: song.id },
    }).then(
      (res) => void console.log(res),
      (err) => void console.error(err),
    )
  })
  const location = useLocation()
  const navigate = useNavigate()
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
        }}
      >
        <SongLook
          song={song}
          parsed={parser.parseSong('my', song.text)}
          transposition={transposition}
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
    </React.Fragment>
  )
}

function setTransposition(query: URLSearchParams, value: number) {
  const res = new URLSearchParams(query)
  if (value) res.set('transposition', value + '')
  else res.delete('transposition')
  return res.toString()
}
