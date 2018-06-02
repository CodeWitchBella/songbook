import React from 'react'
import { query } from 'utils/react-simple-graphql/react-simple-graphql'
import gql from 'graphql-tag'
import * as t from './__generated__/songs'

const SongsContainer = query<t.songs>(gql`
  query songs {
    songs {
      total
      list {
        id
        author
        title
      }
    }
  }
`)
export default SongsContainer
export interface Song extends t.songs_songs_list {}
