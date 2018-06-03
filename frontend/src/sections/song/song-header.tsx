import React from 'react'
import { css } from 'react-emotion'

const header = css`
  display: flex;
  font-weight: bold;
  justify-content: space-between;
  font-size: 3mm;
  padding-bottom: 3mm;
`

const SongHeader = ({ title, author }: { title: string; author: string }) => (
  <div className={header}>
    <div>{title}</div>
    <div>{author}</div>
  </div>
)
export default SongHeader
