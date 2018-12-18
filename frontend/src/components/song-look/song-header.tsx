import React from 'react'
import { css } from 'emotion'

const header = (titleSpace: number | null) => css`
  display: flex;
  font-weight: bold;
  justify-content: space-between;
  font-size: 1.2em;
  padding-bottom: ${numberDefault(titleSpace, 1) * 1.75}em;
  margin: 0.75em 0 0 0;
`

function numberDefault(num: any, def: number): number {
  return typeof num === 'number' ? num : def
}

const SongHeader = ({
  title,
  author,
  titleSpace,
}: {
  title: string
  author: string
  titleSpace: number | null
}) => (
  <h2 className={header(titleSpace)}>
    <div>{title}</div>
    <div>{author}</div>
  </h2>
)
export default SongHeader
