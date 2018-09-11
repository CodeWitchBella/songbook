import React from 'react'
import styled, { css } from 'react-emotion'
import * as page from 'utils/page'
import Page from 'components/page'
import { SongLook } from 'components/song-look/song-look'
import * as parser from 'utils/parse-song'
import { Song } from 'containers/store/store'

class Spotify extends React.Component<{ link: string }, { visible: boolean }> {
  state = { visible: false }
  toggle = () =>
    this.setState(st => ({
      visible: !st.visible,
    }))
  render() {
    const parts = this.props.link.split('/')
    return (
      <div
        css={`
          display: flex;
          position: absolute;
          bottom: 0;
          width: 100%;
          justify-content: flex-end;
          align-items: start;
        `}
      >
        {this.state.visible && (
          <iframe
            src={`https://open.spotify.com/embed/${parts[parts.length - 2]}/${
              parts[parts.length - 1]
            }`}
            height="80"
            frameBorder="0"
            /* eslint-disable-next-line */
            allowtransparency="true"
            allow="encrypted-media"
          />
        )}
        <button
          onClick={this.toggle}
          css={`
            width: 80px;
            height: 80px;
            background: white;
            font-size: 40px;
            border: 1px solid black;
            :hover {
              background: #eee;
            }
          `}
        >
          {this.state.visible ? '⛌' : '⏯'}
        </button>
      </div>
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
}) => (
  <Song id={id}>
    {song =>
      !song ? null : (
        <>
          <SongLook
            share={share}
            song={song}
            parsed={parser.parseSong(song.textWithChords)}
          />
          {song.metadata.spotify && <Spotify link={song.metadata.spotify} />}
        </>
      )
    }
  </Song>
)
export default SongSection
