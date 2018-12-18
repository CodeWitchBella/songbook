/** @jsx jsx */
import { jsx, css } from '@emotion/core'
import { Song } from 'containers/store/store'
import PDF from 'components/pdf'

export default ({ id }: { id: string }) => (
  <Song id={id}>
    {song =>
      song && (
        <div
          css={css`
            &,
            > iframe {
              width: 100%;
              height: 100%;
              overflow: hidden;
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
)
