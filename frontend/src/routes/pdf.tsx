import React from 'react'
import PDF from 'components/pdf'
import styled from '@emotion/styled'
import { errorBoundary } from 'containers/error-boundary'
import { useSong } from 'store/store'

const Style = styled.div`
  &,
  > iframe {
    width: 100%;
    height: 100%;
    overflow: hidden;
    margin: 0;
    padding: 0;
    border: 0;
  }
`

export default errorBoundary(({ id }: { id: string }) => {
  const song = useSong(id)
  if (!song) return <div>Píseň nenalezena</div>
  const { longData } = song
  if (!longData) return <div>Načítám píseň...</div>
  return (
    <Style>
      <PDF song={{ ...song, longData }} />
    </Style>
  )
})
