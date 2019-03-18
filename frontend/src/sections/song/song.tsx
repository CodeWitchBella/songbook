import React from 'react'
import { SongLook } from 'components/song-look/song-look'
import * as parser from 'utils/parse-song'
import styled from '@emotion/styled'
import { useSong } from 'store/song-provider'

const IFrame = (props: any) => <iframe title="Spotify přehrávač" {...props} />

const SpotifyWrap = styled.div`
  display: flex;
  position: absolute;
  bottom: 0;
  width: 100%;
  justify-content: flex-end;
  align-items: start;
`

const SpotifyButton = styled.button`
  width: 80px;
  height: 80px;
  background: white;
  font-size: 40px;
  border: 1px solid black;
  :hover {
    background: #eee;
  }
`

class Spotify extends React.Component<{ link: string }, { visible: boolean }> {
  state = { visible: false }
  toggle = () =>
    this.setState(st => ({
      visible: !st.visible,
    }))
  render() {
    const parts = this.props.link.split('/')
    return (
      <SpotifyWrap>
        {this.state.visible && (
          <IFrame
            src={`https://open.spotify.com/embed/${parts[parts.length - 2]}/${
              parts[parts.length - 1]
            }`}
            height="80"
            frameBorder="0"
            allowtransparency="true"
            allow="encrypted-media"
          />
        )}
        <SpotifyButton type="button" onClick={this.toggle}>
          {this.state.visible ? '⛌' : '⏯'}
        </SpotifyButton>
      </SpotifyWrap>
    )
  }
}

const SongSection = ({
  id,
  share = false,
  enableSpotify = false,
}: {
  id: string
  share?: boolean
  enableSpotify?: boolean
}) => {
  const song = useSong(id).value
  return !song ? null : (
    <>
      <SongLook
        share={share}
        song={song}
        parsed={parser.parseSong(song.textWithChords)}
      />
      {enableSpotify && song.metadata.spotify && (
        <Spotify link={song.metadata.spotify} />
      )}
    </>
  )
}
export default SongSection
