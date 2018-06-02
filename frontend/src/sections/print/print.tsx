import React from 'react'
import SongsContainer from 'containers/songs'
import Song from 'sections/song/song'
import styled from 'react-emotion'

const PlaceholderSongList = () => <div>Načítám seznam písní</div>

const PageBreak = styled.div`
  page-break-after: always;
  @media not print {
    display: block;
    height: 500px;
    line-height: 500px;
  }
  @media print {
    color: transparent;
  }
`

const Print = () => (
  <SongsContainer placeholder={PlaceholderSongList}>
    {songs =>
      !songs.data ? null : (
        <div>
          {songs.data.songs.list.map(s => (
            <React.Fragment key={s.id}>
              <Song id={s.id} />
              <PageBreak>--- page break ---</PageBreak>
            </React.Fragment>
          ))}
        </div>
      )
    }
  </SongsContainer>
)
export default Print
