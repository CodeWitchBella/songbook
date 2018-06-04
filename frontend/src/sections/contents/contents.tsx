import React from 'react'
import { Song } from 'containers/songs'
import Page from 'components/page'
import styled from 'react-emotion'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  flex-wrap: wrap;
  font-size: 0.8em;
  > div {
    max-width: 50%;
    display: flex;
  }
`

const Counter = styled.div`
  padding-right: 0.2em;
`

const Spacer = styled.div`
  height: 10em;
`

const Contents = ({ list }: { list: Song[] }) => (
  <Page>
    <Container>
      <Spacer />
      {list.map((song, i) => (
        <div key={song.id}>
          <Counter>{i + 1}.</Counter>
          <div>
            {song.title} ({song.author.replace(/ /g, '\u00a0')})
          </div>
        </div>
      ))}
    </Container>
  </Page>
)
export default Contents
