import React from 'react'
import { query } from 'utils/react-simple-graphql/react-simple-graphql'
import gql from 'graphql-tag'
import * as t from './__generated__/songsWithText'

const SongsWithTextContainer = query<
  t.songsWithText,
  t.songsWithTextVariables
>(gql`
  query songsWithText($tag: ID!) {
    songs(tag: $tag) {
      total
      list {
        id
        author
        title
        textWithChords
        metadata {
          audio
        }
      }
    }
  }
`)
export default SongsWithTextContainer
export interface Song extends t.songsWithText_songs_list {}
