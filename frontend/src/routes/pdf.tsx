import React from 'react'
import PDF from 'components/pdf'
import styled from '@emotion/styled'
import { errorBoundary } from 'containers/error-boundary'
import { useSong } from 'store/song-provider'

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
  const { value } = useSong(id)
  if (!value) return null
  return (
    <Style>
      <PDF song={value} />
    </Style>
  )
})
