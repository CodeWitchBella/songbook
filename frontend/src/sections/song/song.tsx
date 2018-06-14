import React from 'react'
import styled, { css } from 'react-emotion'
import * as page from 'utils/page'
import Page from 'components/page'
import { SongLook } from 'components/song-look/song-look'
import * as parser from 'utils/parse-song'
import { Song } from 'containers/store/store'

const Placeholder = () => <div>Načítám píseň</div>

const SongSection = ({
  id,
  share = false,
}: {
  id: string
  share?: boolean
}) => (
  <Song id={id}>
    {song =>
      !song ? null : (
        <SongLook
          share={share}
          song={song}
          parsed={parser.parseSong(song.textWithChords)}
        />
      )
    }
  </Song>
)
export default SongSection
