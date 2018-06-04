import React from 'react'
import { css } from 'react-emotion'

const header = css`
  display: flex;
  font-weight: bold;
  justify-content: space-between;
  font-size: 1.2em;
  padding-bottom: 1em;
`

const SongHeader = ({ title, author }: { title: string; author: string }) => (
  <h2 className={header}>
    <div>{title}</div>
    <div>{author}</div>
  </h2>
)
export default SongHeader
