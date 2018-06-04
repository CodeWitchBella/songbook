import React from 'react'
import SongContainer, { Song as SongType } from 'containers/song'
import styled, { css } from 'react-emotion'
import * as page from 'utils/page'
import Page from 'components/page'
import { SongLook } from 'components/song-look/song-look'
import * as parser from 'utils/parse-song'

const Placeholder = () => <div>Načítám píseň</div>

const Song = ({ id, number }: { id: string; number?: number }) => (
  <SongContainer variables={{ id }} placeholder={Placeholder}>
    {song =>
      !song.data || !song.data.song ? null : (
        <SongLook
          number={number}
          song={song.data.song}
          parsed={parser.parseSong(song.data.song.textWithChords)}
        />
      )
    }
  </SongContainer>
)
export default Song
