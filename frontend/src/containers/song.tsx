import React from 'react'
import { query } from 'utils/react-simple-graphql/react-simple-graphql'
import gql from 'graphql-tag'
import * as t from './__generated__/song'

const SongContainer = query<t.song, t.songVariables>(gql`
  query song($id: ID!) {
    song(id: $id) {
      id
      author
      title
      textWithChords
      metadata {
        audio
      }
    }
  }
`)
export default SongContainer
export interface Song extends t.song_song {}
