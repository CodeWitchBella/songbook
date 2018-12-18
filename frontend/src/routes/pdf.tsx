import React from 'react'
import { Song } from 'containers/store/store'
import PDF from 'components/pdf'
import styled from '@emotion/styled'

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

export default ({ id }: { id: string }) => (
  <Song id={id}>
    {song =>
      song && (
        <Style>
          <PDF song={song} />
        </Style>
      )
    }
  </Song>
)
