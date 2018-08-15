import React from 'react'
import { hot } from 'react-hot-loader'
import { Song } from 'containers/store/store'
import PDF from 'components/pdf'

export default hot(module)(({ id }: { id: string }) => (
  <Song id={id}>
    {song =>
      song && (
        <div
          css={`
            &,
            > iframe {
              width: 100%;
              height: 100%;
              margin: 0;
              padding: 0;
              border: 0;
            }
          `}
        >
          <PDF song={song} />
        </div>
      )
    }
  </Song>
))
