import React from 'react'
import { query } from 'utils/react-simple-graphql/react-simple-graphql'
import gql from 'graphql-tag'
import * as t from './__generated__/tags'

const TagsContainer = query<t.tags>(gql`
  query tags {
    tags {
      id
      name
    }
  }
`)
export default TagsContainer
